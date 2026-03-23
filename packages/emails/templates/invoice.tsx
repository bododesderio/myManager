import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface InvoiceEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  invoiceNumber: string;
  planName: string;
  amount: string;
  currency: string;
  billingPeriod: string;
  paymentDate: string;
}

export function InvoiceEmail({ brand, user, invoiceNumber, planName, amount, currency, billingPeriod, paymentDate }: InvoiceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Invoice #{invoiceNumber} from {brand.identity.app_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Invoice #{invoiceNumber}</Text>
            <Text style={text}>Hi {user.name}, here is your payment receipt for {brand.identity.app_name}.</Text>
            <Section style={invoiceBox}>
              <Text style={invoiceLine}><strong>Plan:</strong> {planName}</Text>
              <Text style={invoiceLine}><strong>Amount:</strong> {currency} {amount}</Text>
              <Text style={invoiceLine}><strong>Period:</strong> {billingPeriod}</Text>
              <Text style={invoiceLine}><strong>Payment date:</strong> {paymentDate}</Text>
            </Section>
            <Text style={smallText}>If you have any questions about this invoice, contact {brand.contact.support_email}.</Text>
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
const invoiceBox = { backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '6px', marginTop: '16px' };
const invoiceLine = { fontSize: '14px', color: '#4a4a4a', margin: '4px 0' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default InvoiceEmail;
