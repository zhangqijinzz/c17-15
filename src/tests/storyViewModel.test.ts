import { describe, expect, it } from 'vitest';
import { createStarterStory } from '../models/story';
import { LocalStoryRepository } from '../repositories/storyRepository';
import { MemoryStorageService } from '../services/storageService';
import { StoryViewModel } from '../viewmodels/storyViewModel';

describe('story view model', () => {
  it('initializes, edits, persists, and restores the main flow', () => {
    const repository = new LocalStoryRepository(new MemoryStorageService());
    const viewModel = new StoryViewModel(repository);
    viewModel.initialize();
    expect(viewModel.snapshot.status).toBe('ready');
    viewModel.addCharacter('阿洛', '修复师');
    viewModel.addScene('地下档案室', '他们找到被隐藏的航海日志。');
    const scene = viewModel.selectedScene;
    expect(scene?.title).toBe('地下档案室');
    viewModel.toggleCharacter(scene?.id ?? '', viewModel.snapshot.story?.characters[2]?.id ?? '');
    expect(viewModel.snapshot.stats.characters).toBe(3);

    const restored = new StoryViewModel(repository);
    restored.initialize();
    expect(restored.snapshot.story?.scenes.some((item) => item.title === '地下档案室')).toBe(true);
    expect(restored.snapshot.story?.characters.some((item) => item.name === '阿洛')).toBe(true);
  });

  it('shows recoverable validation feedback and resets corrupt storage', () => {
    const storage = new MemoryStorageService();
    storage.write('{broken');
    const viewModel = new StoryViewModel(new LocalStoryRepository(storage));
    viewModel.initialize();
    viewModel.addCharacter(' ', '');
    expect(viewModel.snapshot.notice).toContain('至少');
    viewModel.resetProject();
    expect(viewModel.snapshot.story?.id).toBe(createStarterStory().id);
  });

  it('creates clues only for scenes currently visible in the list', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()));
    viewModel.initialize();
    const [firstScene, secondScene] = viewModel.snapshot.story!.scenes;

    viewModel.setSearch(firstScene.title);
    viewModel.addClue('罗盘上的刻痕', firstScene.id, '');
    expect(viewModel.snapshot.story?.clues.some((clue) => clue.title === '罗盘上的刻痕')).toBe(true);

    viewModel.addClue('铜钥匙', secondScene.id, firstScene.id);
    expect(viewModel.snapshot.notice).toContain('埋下');
    expect(viewModel.snapshot.story?.clues.some((clue) => clue.title === '铜钥匙')).toBe(false);

    viewModel.addClue('铜钥匙', firstScene.id, secondScene.id);
    expect(viewModel.snapshot.notice).toContain('回收');
    expect(viewModel.snapshot.story?.clues.some((clue) => clue.title === '铜钥匙')).toBe(false);
  });

  it('keeps clues intact and findable after narrowing the scene search', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()));
    viewModel.initialize();
    const [firstScene, secondScene] = viewModel.snapshot.story!.scenes;
    viewModel.addClue('罗盘上的刻痕', firstScene.id, secondScene.id);

    viewModel.setSearch(secondScene.title);
    expect(viewModel.visibleScenes.map((scene) => scene.id)).toEqual([secondScene.id]);
    const clue = viewModel.snapshot.story?.clues.find((item) => item.title === '罗盘上的刻痕');
    expect(clue?.setupSceneId).toBe(firstScene.id);
    expect(viewModel.snapshot.story?.scenes.find((scene) => scene.id === clue!.setupSceneId)?.title).toBe(firstScene.title);
  });
});
