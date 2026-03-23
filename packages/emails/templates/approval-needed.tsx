import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface ApprovalNeededEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  authorName: string;
  postCaption: string;
  platforms: string[];
  approvalUrl: string;
}

export function ApprovalNeededEmail({ brand, user, authorName, postCaption, platforms, approvalUrl }: ApprovalNeededEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{authorName} submitted a post for your approval on {brand.identity.app_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Post needs your approval</Text>
            <Text style={text}>Hi {user.name}, <strong>{authorName}</strong> has submitted a post for your review on {brand.identity.app_name}.</Text>
            <Section style={detailBox}>
              <Text style={detailText}><strong>Platforms:</strong> {platforms.join(', ')}</Text>
              <Text style={detailText}><strong>Caption:</strong> {postCaption.slice(0, 150)}{postCaption.length > 150 ? '...' : ''}</Text>
            </Section>
            <Button style={button} href={approvalUrl}>Review post</Button>
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
const detailBox = { backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '6px', marginTop: '16px' };
const detailText = { fontSize: '14px', color: '#4a4a4a', margin: '4px 0' };
const button = { backgroundColor: '#7F77DD', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontWeight: '600' as const, display: 'inline-block' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default ApprovalNeededEmail;
