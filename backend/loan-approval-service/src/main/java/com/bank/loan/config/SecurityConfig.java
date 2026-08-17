package com.bank.loan.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configure(http))
                .authorizeHttpRequests(auth -> auth
                        // السماح التام لكافة مسارات Camunda و H2 Console و API
                        .requestMatchers(
                                "/camunda/**",
                                "/camunda-welcome/**",
                                "/app/**",
                                "/lib/**",
                                "/api/**",
                                "/h2-console/**"
                        ).permitAll()
                        .anyRequest().permitAll()
                )
                .headers(headers -> headers.frameOptions(frame -> frame.disable())); // للسماح بفتح H2 و Camunda داخل Frames

        return http.build();
    }
}