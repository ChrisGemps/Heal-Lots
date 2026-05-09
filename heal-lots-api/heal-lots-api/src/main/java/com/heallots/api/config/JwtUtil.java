package com.heallots.api.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private SecretKey getSigningKey() {
        // Ensure the secret is at least 512 bits (64 bytes) for HS512
        byte[] secretBytes;
        
        // Check if the secret appears to be Base64 encoded
        try {
            secretBytes = Base64.getDecoder().decode(jwtSecret);
        } catch (IllegalArgumentException e) {
            // If not Base64, convert string to bytes
            secretBytes = jwtSecret.getBytes();
        }
        
        // Pad the secret if it's too short (less than 64 bytes for HS512)
        if (secretBytes.length < 64) {
            byte[] paddedSecret = new byte[64];
            System.arraycopy(secretBytes, 0, paddedSecret, 0, secretBytes.length);
            // Fill remaining bytes with a pattern to ensure proper length
            for (int i = secretBytes.length; i < 64; i++) {
                paddedSecret[i] = (byte) (jwtSecret.hashCode() ^ i);
            }
            secretBytes = paddedSecret;
        }
        
        return Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
