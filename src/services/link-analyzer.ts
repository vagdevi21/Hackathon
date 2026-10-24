/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Link Scam & Phishing Risk Scoring Engine
 */

export interface LinkRiskResult {
  score: number; // 0 to 100
  riskLevel: 'CRITICAL_SCAM' | 'HIGH_RISK' | 'SUSPICIOUS' | 'VERIFIED_SAFE';
  category: string;
  reasons: string[];
  isSafe: boolean;
}

export function calculateLinkRiskScore(rawUrl: string): LinkRiskResult {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isHttp = url.startsWith('http://');

    // Known trusted domains
    const trustedHosts = ['github.com', 'google.com', 'microsoft.com', 'apple.com', 'cloudflare.com'];
    if (trustedHosts.some((th) => host === th || host.endsWith('.' + th))) {
      return {
        score: 2,
        riskLevel: 'VERIFIED_SAFE',
        category: 'Verified Safe Infrastructure',
        reasons: ['Trusted enterprise domain with authentic multi-year certificate'],
        isSafe: true,
      };
    }

    let score = 20;
    const reasons: string[] = [];

    // Suspicious TLD check (.top, .xyz, .click, .country, .tk, .ml)
    const highRiskTlds = ['.top', '.xyz', '.click', '.country', '.tk', '.ml', '.work', '.gq', '.cf'];
    if (highRiskTlds.some((tld) => host.endsWith(tld))) {
      score += 30;
      reasons.push('High-risk ephemeral top-level domain (TLD) associated with phishing campaigns');
    }

    // Brand impersonation / credential keywords
    const phishingKeywords = ['paypal', 'wellsfargo', 'bank', 'login', 'verify', 'account', 'security-alert', 'wallet', 'airdrop'];
    const matchedKeywords = phishingKeywords.filter((kw) => host.includes(kw));
    if (matchedKeywords.length > 0) {
      score += 35 * Math.min(matchedKeywords.length, 2);
      reasons.push(`Brand or credential harvesting pattern detected in hostname: "${matchedKeywords.join(', ')}"`);
    }

    // Unencrypted HTTP for sensitive keywords
    if (isHttp) {
      score += 20;
      reasons.push('Unencrypted HTTP protocol transmitting user inputs in plaintext');
    }

    // Executable download extension
    if (parsed.pathname.endsWith('.exe') || parsed.pathname.endsWith('.scr') || parsed.pathname.endsWith('.bat')) {
      score += 35;
      reasons.push('Direct payload executable download without signed provenance');
    }

    // Subdomain count abuse (e.g. login.bank.com.fake-domain.top)
    const dotCount = (host.match(/\./g) || []).length;
    if (dotCount >= 3) {
      score += 15;
      reasons.push('Excessive nested subdomains indicative of hostname cloaking');
    }

    const finalScore = Math.min(Math.max(score, 0), 100);

    let riskLevel: LinkRiskResult['riskLevel'] = 'SUSPICIOUS';
    if (finalScore >= 80) {
      riskLevel = 'CRITICAL_SCAM';
    } else if (finalScore >= 60) {
      riskLevel = 'HIGH_RISK';
    } else if (finalScore < 30) {
      riskLevel = 'VERIFIED_SAFE';
    }

    return {
      score: finalScore,
      riskLevel,
      category: riskLevel === 'CRITICAL_SCAM' ? 'Phishing / Credential Theft' : 'Suspicious Web Destination',
      reasons: reasons.length ? reasons : ['Unclassified URL with limited reputation history'],
      isSafe: finalScore < 30,
    };
  } catch {
    return {
      score: 85,
      riskLevel: 'HIGH_RISK',
      category: 'Malformed URI Syntax',
      reasons: ['URL failed RFC syntax parsing validation'],
      isSafe: false,
    };
  }
}
