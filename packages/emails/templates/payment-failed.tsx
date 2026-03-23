import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface PaymentFailedEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  planName: string;
  retryDate: string;
  updatePaymentUrl: string;
}

export function PaymentFailedEmail({ brand, user, planName, retryDate, updatePaymentUrl }: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment failed for your {brand.identity.app_name} {planName} plan</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Payment failed</Text>
            <Text style={text}>Hi {user.name}, we were unable to process your payment for the {planName} plan on {brand.identity.app_name}.</Text>
            <Text style={text}>We will retry the payment on {retryDate}. To avoid any interruption to your service, please update your payment method.</Text>
            <Button style={button} href={updatePaymentUrl}>Update payment method</Button>
            <Text style={smallText}>If you need assistance, contact {brand.contact.support_email}.</Text>
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
const button = { backgroundColor: '#e74c3c', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontWeight: '600' as const, display: 'inline-block' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default PaymentFailedEmail;
