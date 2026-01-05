const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";

export const generateLineAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const state = Math.random().toString(36).substring(7);

    if (typeof window !== 'undefined') {
        localStorage.setItem("line_auth_state", state);
    }

    // Always use production URL for LINE callback (must match LINE Developers Console)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech';
    const redirectUri = encodeURIComponent(`${siteUrl}/auth/callback/line`);

    return `${LINE_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20profile`;
};
