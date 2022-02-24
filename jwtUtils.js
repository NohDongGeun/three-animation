import jwt_decode from "jwt-decode";

export function decodeJwtToken(token) {
    if (token) {
        const payload = jwt_decode(token)
        return payload;
    }
}
