import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Img, Hr, Link, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface PlanRenewingEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  planName: string;
  amount: string;
  currency: string;
  renewalDate: string;
  billingUrl: string;
}

export function PlanRenewingEmail({ brand, user, planName, amount, currency, renewalDate, billingUrl }: PlanRenewingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {brand.identity.app_name} {planName} plan renews on {renewalDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Subscription renewal reminder</Text>
            <Text style={text}>Hi {user.name}, your <strong>{planName}</strong> plan on {brand.identity.app_name} will automatically renew on <strong>{renewalDate}</strong>.</Text>
            <Text style={text}>Amount: <strong>{currency} {amount}</strong></Text>
            <Text style={text}>
              To update your payment method or change your plan, visit your <Link href={billingUrl}>billing settings</Link>.
            </Text>
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
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default PlanRenewingEmail;
