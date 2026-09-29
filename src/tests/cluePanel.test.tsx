// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { CluePanel } from '../components/CluePanel';
import { LocalStoryRepository } from '../repositories/storyRepository';
import { MemoryStorageService } from '../services/storageService';
import { StoryViewModel } from '../viewmodels/storyViewModel';

function renderPanel(viewModel: StoryViewModel, scenes = viewModel.visibleScenes): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<CluePanel viewModel={viewModel} scenes={scenes} />); });
  return { root, container };
}

function setNativeValue(element: Element, value: string): void {
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('CluePanel', () => {
  it('clears a selected setup scene once it is filtered out instead of submitting it blind', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()));
    viewModel.initialize();
    const [firstScene, secondScene] = viewModel.snapshot.story!.scenes;
    const { root, container } = renderPanel(viewModel);

    const setup = container.querySelector('select[aria-label="埋下场景"]') as HTMLSelectElement;
    act(() => { setNativeValue(setup, firstScene.id); });
    expect(setup.value).toBe(firstScene.id);

    act(() => { viewModel.setSearch(secondScene.title); });
    act(() => { root.render(<CluePanel viewModel={viewModel} scenes={viewModel.visibleScenes} />); });

    expect(setup.value).toBe('');
    const titleInput = container.querySelector('input[aria-label="伏笔名称"]') as HTMLInputElement;
    act(() => { setNativeValue(titleInput, '罗盘上的刻痕'); });
    const button = container.querySelector('button') as HTMLButtonElement;
    act(() => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(viewModel.snapshot.notice).toContain('埋下');
    expect(viewModel.snapshot.story?.clues.some((clue) => clue.title === '罗盘上的刻痕')).toBe(false);
    act(() => { root.unmount(); });
  });

  it('renders existing clues with their scene names even after the scenes are filtered out', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()));
    viewModel.initialize();
    const [firstScene, secondScene] = viewModel.snapshot.story!.scenes;
    viewModel.addClue('罗盘上的刻痕', firstScene.id, secondScene.id);
    const { root, container } = renderPanel(viewModel, [secondScene]);

    const clueRow = [...container.querySelectorAll('.clue-row')].find((row) =>
      row.textContent?.includes('罗盘上的刻痕')) as HTMLElement;
    const clueText = clueRow.querySelector('span:last-child')?.textContent ?? '';
    expect(clueText).toContain(firstScene.title);
    expect(clueText).toContain(secondScene.title);
    expect(clueText).not.toContain('未知场景');
    act(() => { root.unmount(); });
  });
});
