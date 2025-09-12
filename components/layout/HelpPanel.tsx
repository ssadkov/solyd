'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { HelpCircle, MessageCircle, BookOpen, ExternalLink } from 'lucide-react'

export default function HelpPanel() {
  const helpSections = [
    {
      title: 'Getting Started',
      description: 'Learn how to use Solyd',
      icon: BookOpen,
      items: [
        'How to connect your wallet',
        'Understanding DeFi protocols',
        'Managing your assets',
        'Security best practices'
      ]
    },
    {
      title: 'Protocols',
      description: 'Supported DeFi protocols',
      icon: ExternalLink,
      items: [
        'Raydium - Liquidity pools',
        'Marinade - SOL staking',
        'Orca - Yield farming',
        'Solend - Lending platform'
      ]
    }
  ]

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Help & Support</h2>
        </div>
      </div>

      {/* Help Sections */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {helpSections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      • {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">What is Solyd?</h4>
              <p className="text-xs text-muted-foreground">
                Solyd is a DeFi dashboard that aggregates earning opportunities from various Solana protocols.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Is it safe?</h4>
              <p className="text-xs text-muted-foreground">
                We only integrate with audited and trusted protocols. Always do your own research.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">What fees are involved?</h4>
              <p className="text-xs text-muted-foreground">
                Fees depend on the specific protocol you interact with. We don't charge additional fees.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Section - Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Community Chat</CardTitle>
            </div>
            <CardDescription>Get help from the community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Chat integration coming soon
              </p>
              <Button variant="outline" size="sm" disabled>
                Join Discord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Solyd v1.0.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Built on Solana
          </p>
        </div>
      </div>
    </div>
  )
}
