import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface WelcomeEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  loginUrl: string;
}

export function WelcomeEmail({ brand, user, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {brand.identity.app_name}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Welcome to {brand.identity.app_name}, {user.name}!</Text>
            <Text style={text}>
              Thanks for signing up. You are now ready to create, schedule, and publish content across all your social media platforms from one place.
            </Text>
            <Text style={text}>Here is what you can do next:</Text>
            <Text style={text}>1. Connect your social media accounts</Text>
            <Text style={text}>2. Create your first post</Text>
            <Text style={text}>3. Explore your analytics dashboard</Text>
            <Button style={button} href={loginUrl}>
              Get started
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {brand.legal.copyright_year_start}&ndash;{new Date().getFullYear()} {brand.legal.copyright_owner}. All rights reserved.
          </Text>
          <Text style={footer}>
            Need help? Contact us at {brand.contact.support_email}
          </Text>
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
const button = { backgroundColor: '#7F77DD', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontWeight: '600' as const, display: 'inline-block' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default WelcomeEmail;
