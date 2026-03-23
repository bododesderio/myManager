import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface SocialTokenExpiredEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  platform: string;
  accountName: string;
  reconnectUrl: string;
}

export function SocialTokenExpiredEmail({ brand, user, platform, accountName, reconnectUrl }: SocialTokenExpiredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reconnect your {platform} account on {brand.identity.app_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Social account disconnected</Text>
            <Text style={text}>Hi {user.name}, the connection to your <strong>{platform}</strong> account (<strong>{accountName}</strong>) has expired on {brand.identity.app_name}.</Text>
            <Text style={text}>Scheduled posts to this account will not be published until you reconnect.</Text>
            <Button style={button} href={reconnectUrl}>Reconnect {platform}</Button>
            <Text style={smallText}>This usually happens when platform permissions change or when the authentication token expires. Reconnecting takes less than 30 seconds.</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>&copy; {brand.legal.copyright_year_start}&ndash;{new Date().getFullYear()} {brand.legal.copyright_owner}</Text>
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

export default SocialTokenExpiredEmail;
