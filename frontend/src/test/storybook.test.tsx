import { composeStories, setProjectAnnotations } from '@storybook/react';
import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import * as previewAnnotations from '../../.storybook/preview';
import * as ExpenseLineChartStories from '../components/charts/ExpenseLineChart.stories';
import * as MemberPieChartStories from '../components/charts/MemberPieChart.stories';
import * as MonthlyBarChartStories from '../components/charts/MonthlyBarChart.stories';
import * as DeleteConfirmModalStories from '../components/DeleteConfirmModal.stories';
import * as ErrorModalStories from '../components/ErrorModal.stories';
import * as ExpenseModalStories from '../components/ExpenseModal.stories';
import * as LayoutStories from '../components/Layout.stories';
import * as NotificationStories from '../components/Notification.stories';

// Apply global decorators from preview
const project = setProjectAnnotations(previewAnnotations);
beforeAll(project.beforeAll);

// Compose stories with decorators applied
const deleteConfirmModalStories = composeStories(DeleteConfirmModalStories);
const errorModalStories = composeStories(ErrorModalStories);
const expenseModalStories = composeStories(ExpenseModalStories);
const layoutStories = composeStories(LayoutStories);
const notificationStories = composeStories(NotificationStories);
const expenseLineChartStories = composeStories(ExpenseLineChartStories);
const memberPieChartStories = composeStories(MemberPieChartStories);
const monthlyBarChartStories = composeStories(MonthlyBarChartStories);

describe('Storybookコンポーネントテスト', () => {
  describe('DeleteConfirmModal', () => {
    it('Defaultがレンダリングされplay関数が実行される', async () => {
      const { container } = render(<deleteConfirmModalStories.Default />);
      expect(container).toBeInTheDocument();
      await deleteConfirmModalStories.Default.play?.({ canvasElement: container });
    });
  });

  describe('ErrorModal', () => {
    it('Defaultがレンダリングされplay関数が実行される', async () => {
      const { container } = render(<errorModalStories.Default />);
      expect(container).toBeInTheDocument();
      await errorModalStories.Default.play?.({ canvasElement: container });
    });

    it('CustomButtonTextがレンダリングされplay関数が実行される', async () => {
      const { container } = render(<errorModalStories.CustomButtonText />);
      expect(container).toBeInTheDocument();
      await errorModalStories.CustomButtonText.play?.({ canvasElement: container });
    });

    it('LongMessageがレンダリングされる', () => {
      const { container } = render(<errorModalStories.LongMessage />);
      expect(container).toBeInTheDocument();
    });

    it('Closedがレンダリングされplay関数が実行される', async () => {
      const { container } = render(<errorModalStories.Closed />);
      expect(container).toBeInTheDocument();
      await errorModalStories.Closed.play?.({ canvasElement: container });
    });
  });

  describe('ExpenseModal', () => {
    it('Createがレンダリングされる', () => {
      const { container } = render(<expenseModalStories.Create />);
      expect(container).toBeInTheDocument();
    });

    it('Editがレンダリングされる', () => {
      const { container } = render(<expenseModalStories.Edit />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('Defaultがレンダリングされる', () => {
      const { container } = render(<layoutStories.Default />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Notification', () => {
    it('Successがレンダリングされplay関数が実行される', async () => {
      const { container } = render(<notificationStories.Success />);
      expect(container).toBeInTheDocument();
      await notificationStories.Success.play?.({ canvasElement: container });
    });

    it('ErrorStateがレンダリングされる', () => {
      const { container } = render(<notificationStories.ErrorState />);
      expect(container).toBeInTheDocument();
    });

    it('Infoがレンダリングされる', () => {
      const { container } = render(<notificationStories.Info />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('チャート', () => {
    it('ExpenseLineChartのDefaultがレンダリングされる', () => {
      const { container } = render(<expenseLineChartStories.Default />);
      expect(container).toBeInTheDocument();
    });

    it('MemberPieChartのDefaultがレンダリングされる', () => {
      const { container } = render(<memberPieChartStories.Default />);
      expect(container).toBeInTheDocument();
    });

    it('MonthlyBarChartのDefaultがレンダリングされる', () => {
      const { container } = render(<monthlyBarChartStories.Default />);
      expect(container).toBeInTheDocument();
    });
  });
});
