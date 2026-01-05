const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";

export const generateLineAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const state = Math.random().toString(36).substring(7);
    if (typeof window !== 'undefined') {
        localStorage.setItem("line_auth_state", state);
    }
    const redirectUri = typeof window !== 'undefined'
        ? encodeURIComponent(`${window.location.origin}/auth/callback/line`)
        : '';

    return `${LINE_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20profile`;
};
