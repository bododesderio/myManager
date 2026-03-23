import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface RevisionRequestedEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  reviewerName: string;
  comment: string;
  postUrl: string;
}

export function RevisionRequestedEmail({ brand, user, reviewerName, comment, postUrl }: RevisionRequestedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{reviewerName} requested changes to your post on {brand.identity.app_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Revision requested</Text>
            <Text style={text}>Hi {user.name}, <strong>{reviewerName}</strong> has requested changes to your post on {brand.identity.app_name}.</Text>
            <Section style={commentBox}>
              <Text style={commentText}>"{comment}"</Text>
            </Section>
            <Button style={button} href={postUrl}>Edit post</Button>
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
const commentBox = { backgroundColor: '#fff8e1', padding: '16px', borderRadius: '6px', marginTop: '16px', borderLeft: '4px solid #f5a623' };
const commentText = { fontSize: '14px', color: '#4a4a4a', fontStyle: 'italic' as const };
const button = { backgroundColor: '#7F77DD', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontWeight: '600' as const, display: 'inline-block' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default RevisionRequestedEmail;
