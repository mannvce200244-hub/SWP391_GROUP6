package com.m4n.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "m4n.pos.invoice-email.enabled", havingValue = "true", matchIfMissing = true)
public class PosInvoiceEmailConfiguration {}
