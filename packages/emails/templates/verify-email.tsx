import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface VerifyEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  verifyUrl: string;
}

export function VerifyEmailEmail({ brand, user, verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email for {brand.identity.app_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Verify your email address</Text>
            <Text style={text}>Hi {user.name}, please verify your email address to complete your {brand.identity.app_name} account setup.</Text>
            <Button style={button} href={verifyUrl}>Verify email address</Button>
            <Text style={smallText}>This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>&copy; {brand.legal.copyright_year_start}&ndash;{new Date().getFullYear()} {brand.legal.copyright_owner}</Text>
          <Text style={footer}>Questions? Contact {brand.contact.support_email}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const container = { margin: '0 auto', padding: '40px 20px', maxWidth: '560px' };
const section = { padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px' };
const heading = { fontSize: '24px', fontWeight: '600' as const, color: '#1a1a1a', marginBottom: '16px' };
const text = { fontSize: '16px', color: '#4a4a4a', lineHeight: '1.6' };
const smallText = { fontSize: '13px', color: '#8898aa', lineHeight: '1.5', marginTop: '16px' };
const button = { backgroundColor: '#7F77DD', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontWeight: '600' as const, display: 'inline-block' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default VerifyEmailEmail;
