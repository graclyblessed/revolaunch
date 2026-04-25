import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components'
import * as React from 'react'

interface ClaimProfileEmailProps {
  startupName: string
  tagline: string
  claimUrl: string
  siteUrl: string
}

export default function ClaimProfileEmail({
  startupName,
  tagline,
  claimUrl,
  siteUrl,
}: ClaimProfileEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your startup {startupName} is listed on Revolaunch — claim your profile today.
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
          {/* Header with gradient */}
          <Section style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            padding: '32px 32px 24px',
          }}>
            <Text style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              Revolaunch
            </Text>
            <Text style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.85)',
              margin: '4px 0 0',
            }}>
              Where startups get seen
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px' }}>
            <Text style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#ffffff',
              margin: '0 0 8px',
            }}>
              Your startup is live on Revolaunch
            </Text>

            <Text style={{
              fontSize: '15px',
              color: '#a3a3a3',
              lineHeight: '1.6',
              margin: '0 0 24px',
            }}>
              Great news! <strong style={{ color: '#ffffff' }}>{startupName}</strong> has been listed on
              Revolaunch, the platform where founders showcase their startups to thousands of
              visitors, investors, and early adopters every month.
            </Text>

            {/* Startup card preview */}
            <Section style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #262626',
            }}>
              <Text style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#f97316',
                margin: '0 0 6px',
              }}>
                {startupName}
              </Text>
              <Text style={{
                fontSize: '14px',
                color: '#a3a3a3',
                margin: 0,
                lineHeight: '1.5',
              }}>
                {tagline}
              </Text>
            </Section>

            <Text style={{
              fontSize: '15px',
              color: '#a3a3a3',
              lineHeight: '1.6',
              margin: '0 0 24px',
            }}>
              By claiming your profile, you&apos;ll be able to update your description, add team
              perks, verify your badge, track analytics, and connect with potential users and
              investors.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
              <Button
                href={claimUrl}
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                  padding: '14px 36px',
                  borderRadius: '8px',
                  letterSpacing: '-0.2px',
                }}
              >
                Claim Your Profile
              </Button>
            </Section>

            <Text style={{
              fontSize: '13px',
              color: '#737373',
              textAlign: 'center',
              margin: '0 0 0',
            }}>
              Or copy this link into your browser:
            </Text>
            <Text style={{
              fontSize: '13px',
              color: '#f97316',
              textAlign: 'center',
              margin: '4px 0 0',
              wordBreak: 'break-all',
            }}>
              {claimUrl}
            </Text>
          </Section>

          {/* Divider */}
          <Section style={{ padding: '0 32px' }}>
            <Hr style={{
              borderColor: '#262626',
              margin: 0,
            }} />
          </Section>

          {/* Benefits section */}
          <Section style={{ padding: '24px 32px' }}>
            <Text style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#737373',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px',
            }}>
              What you get when you claim
            </Text>
            <Section>
              <Text style={{ fontSize: '14px', color: '#a3a3a3', margin: '0 0 8px' }}>
                ✅ Full control over your listing details
              </Text>
              <Text style={{ fontSize: '14px', color: '#a3a3a3', margin: '0 0 8px' }}>
                ✅ Analytics dashboard with views and clicks
              </Text>
              <Text style={{ fontSize: '14px', color: '#a3a3a3', margin: '0 0 8px' }}>
                ✅ Verified badge for credibility
              </Text>
              <Text style={{ fontSize: '14px', color: '#a3a3a3', margin: '0 0 8px' }}>
                ✅ Add team perks to attract early users
              </Text>
              <Text style={{ fontSize: '14px', color: '#a3a3a3', margin: 0 }}>
                ✅ Priority support from our team
              </Text>
            </Section>
          </Section>

          {/* Divider */}
          <Section style={{ padding: '0 32px' }}>
            <Hr style={{
              borderColor: '#262626',
              margin: 0,
            }} />
          </Section>

          {/* Footer */}
          <Section style={{ padding: '24px 32px 32px' }}>
            <Text style={{
              fontSize: '13px',
              color: '#525252',
              lineHeight: '1.6',
              margin: '0 0 16px',
            }}>
              This email was sent because {startupName} appears on Revolaunch.
              If you believe this was sent in error, you can safely ignore this email.
            </Text>
            <Text style={{
              fontSize: '12px',
              color: '#404040',
              margin: 0,
            }}>
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
