import type { Meta, StoryObj } from '@storybook/react-vite'
import Layout from './Layout'

const meta = {
  title: 'Components/Layout',
  component: Layout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Layout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Layout {...args}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">ダッシュボード</h2>
        <p className="text-gray-700 dark:text-gray-300">
          ここにメインコンテンツが入ります。ナビバー右上のアイコンでダークモードを切り替えできます。
        </p>
      </div>
    </Layout>
  ),
}

