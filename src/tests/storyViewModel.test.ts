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

  it('rejects clues whose setup or payoff scene no longer exists', () => {
    const repository = new LocalStoryRepository(new MemoryStorageService());
    const viewModel = new StoryViewModel(repository);
    viewModel.initialize();
    const story = viewModel.snapshot.story!;
    const missingSceneId = 'scene-does-not-exist';

    // 埋下场景已失效 → 拒绝提交，伏笔数不变
    viewModel.addClue('罗盘上的刻痕', missingSceneId, '');
    expect(viewModel.snapshot.notice).toContain('埋下场景已失效');
    expect(viewModel.snapshot.story?.clues).toHaveLength(story.clues.length);

    // 回收场景已失效 → 拒绝提交，伏笔数不变
    viewModel.addClue('罗盘上的刻痕', story.scenes[0].id, missingSceneId);
    expect(viewModel.snapshot.notice).toContain('回收场景已失效');
    expect(viewModel.snapshot.story?.clues).toHaveLength(story.clues.length);

    // 场景都有效 → 正常建立关系
    viewModel.addClue('罗盘上的刻痕', story.scenes[0].id, story.scenes[1].id);
    expect(viewModel.snapshot.notice).toContain('伏笔关系已建立');
    expect(viewModel.snapshot.story?.clues).toHaveLength(story.clues.length + 1);
  });
});
