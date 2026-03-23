import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview } from '@react-email/components';
import type { BrandConfig } from '@mymanager/config';

export interface PostFailedEmailProps {
  brand: BrandConfig;
  user: { name: string; email: string };
  platform: string;
  postCaption: string;
  errorMessage: string;
  postUrl: string;
}

export function PostFailedEmail({ brand, user, platform, postCaption, errorMessage, postUrl }: PostFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Post to {platform} failed on {brand.identity.app_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={brand.identity.logo_url} width="150" height="40" alt={brand.identity.app_name} />
          <Section style={section}>
            <Text style={heading}>Post failed to publish</Text>
            <Text style={text}>Hi {user.name}, your post to <strong>{platform}</strong> failed to publish.</Text>
            <Section style={detailBox}>
              <Text style={detailText}><strong>Caption:</strong> {postCaption.slice(0, 100)}{postCaption.length > 100 ? '...' : ''}</Text>
              <Text style={detailText}><strong>Error:</strong> {errorMessage}</Text>
            </Section>
            <Button style={button} href={postUrl}>View post</Button>
            <Text style={smallText}>You can retry publishing from the post editor. If the problem persists, contact {brand.contact.support_email}.</Text>
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
const detailBox = { backgroundColor: '#fef2f2', padding: '16px', borderRadius: '6px', marginTop: '16px', borderLeft: '4px solid #e74c3c' };
const detailText = { fontSize: '14px', color: '#4a4a4a', margin: '4px 0' };
const button = { backgroundColor: '#7F77DD', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontWeight: '600' as const, display: 'inline-block' };
const hr = { borderColor: '#e6e6e6', margin: '24px 0' };
const footer = { fontSize: '12px', color: '#8898aa', textAlign: 'center' as const };

export default PostFailedEmail;
