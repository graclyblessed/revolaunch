import { Html, Head, Body, Container, Section, Text, Button, Hr, Preview } from '@react-email/components'
import * as React from 'react'

interface SubmissionConfirmationEmailProps {
  startupName: string
  tagline: string
  tier: string
  siteUrl: string
}

export default function SubmissionConfirmationEmail({
  startupName,
  tagline,
  tier,
  siteUrl,
}: SubmissionConfirmationEmailProps) {
  const isPaid = tier !== 'free'

  return (
    <Html>
      <Head />
      <Preview>
        Your startup {startupName} has been submitted to Revolaunch!
      </Preview>
      <Body style={{
        backgroundColor: '#0a0a0a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: 0,
        padding: '40px 20px',
      }}>
        <Container style={{
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: '#111111',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #222222',
        }}>
          {/* Header */}
          <Section style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            padding: '32px 32px 24px',
          }}>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Revolaunch
            </Text>
            <Text style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>
              Where startups get seen
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px' }}>
            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', margin: '0 0 8px' }}>
              🎉 Your startup is now live!
            </Text>

            <Text style={{ fontSize: '15px', color: '#a3a3a3', lineHeight: '1.6', margin: '0 0 24px' }}>
              Congratulations! <strong style={{ color: '#ffffff' }}>{startupName}</strong> has been
              successfully submitted to Revolaunch and is now visible in our directory.
            </Text>

            {/* Startup preview */}
            <Section style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #262626',
            }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: '#f97316', margin: '0 0 6px' }}>
                {startupName}
              </Text>
              <Text style={{ fontSize: '14px', color: '#a3a3a3', margin: '0 0 8px' }}>
                {tagline}
              </Text>
              <Text style={{ fontSize: '13px', color: '#737373', margin: 0 }}>
                Launch tier: <strong style={{ color: '#f97316' }}>{tier === 'free' ? 'Free Launch' : tier}</strong>
              </Text>
            </Section>

            {isPaid && (
              <Text style={{ fontSize: '14px', color: '#a3a3a3', lineHeight: '1.6', margin: '0 0 24px' }}>
                Your paid launch includes priority placement, a guaranteed backlink, and newsletter
                feature. Our team will process your listing within 24 hours.
              </Text>
            )}

            {!isPaid && (
              <>
                <Text style={{ fontSize: '14px', color: '#a3a3a3', lineHeight: '1.6', margin: '0 0 8px' }}>
                  To maximize your visibility on Revolaunch, consider upgrading to a paid tier:
                </Text>
                <ul style={{ fontSize: '14px', color: '#a3a3a3', lineHeight: '1.8', margin: '0 0 24px', paddingLeft: '20px' }}>
                  <li><strong style={{ color: '#fff' }}>Premium ($9)</strong> — Skip the queue + guaranteed backlink</li>
                  <li><strong style={{ color: '#fff' }}>Premium Plus ($12.5)</strong> — Homepage spotlight + X share</li>
                  <li><strong style={{ color: '#fff' }}>SEO Growth ($49)</strong> — Dedicated article + organic traffic</li>
                </ul>
              </>
            )}

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
              <Button
                href={`${siteUrl}/startups`}
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                  padding: '14px 36px',
                  borderRadius: '8px',
                }}
              >
                Browse All Startups
              </Button>
            </Section>

            <Text style={{ fontSize: '13px', color: '#525252', lineHeight: '1.6', margin: 0 }}>
              Questions? Reply to this email and our team will help.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: '#262626', margin: 0 }} />
          <Section style={{ padding: '20px 32px' }}>
            <Text style={{ fontSize: '12px', color: '#404040', margin: 0 }}>
              Revolaunch ·{' '}
              <a href={siteUrl} style={{ color: '#f97316', textDecoration: 'none' }}>
                {siteUrl.replace('https://', '')}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
