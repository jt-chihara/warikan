import type { Preview } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { DarkModeProvider } from '../src/contexts/DarkModeContext'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DarkModeProvider>
          <div className="p-4">
            <Story />
          </div>
        </DarkModeProvider>
      </MemoryRouter>
    ),
  ],
};

export default preview;
