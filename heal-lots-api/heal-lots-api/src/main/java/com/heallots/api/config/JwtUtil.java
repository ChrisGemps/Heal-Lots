package com.heallots.api.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private SecretKey getSigningKey() {
        byte[] secretBytes = resolveSecretBytes();
        return Keys.hmacShaKeyFor(secretBytes);
    }

    private byte[] resolveSecretBytes() {
        byte[] secretBytes = decodeBase64Secret(jwtSecret);
        if (secretBytes == null) {
            secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }

        if (secretBytes.length >= 64) {
            return secretBytes;
        }

        return sha512(secretBytes);
    }

    private byte[] decodeBase64Secret(String secret) {
        try {
            return Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private byte[] sha512(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-512").digest(value);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-512 is not available on this JVM.", e);
        }
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
