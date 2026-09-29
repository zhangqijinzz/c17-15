import { describe, expect, it } from 'vitest';
import { createStarterStory } from '../models/story';
import { getStats, getTimelineWarning, orderedScenes, reconcileSceneSelection, sanitizeStory, validateName } from '../models/storyRules';

describe('story domain rules', () => {
  it('sorts scenes and calculates unresolved clues', () => {
    const story = createStarterStory();
    story.scenes = [...story.scenes].reverse();
    expect(orderedScenes(story).map((scene) => scene.title)).toEqual(['旧港口的来信', '风暴前夜']);
    expect(getStats(story)).toMatchObject({ characters: 2, scenes: 2, clues: 1, unresolvedClues: 1, completion: 80 });
  });

  it('guards invalid names and duplicate timeline orders', () => {
    const story = createStarterStory();
    story.scenes[1].order = story.scenes[0].order;
    expect(validateName(' ')).toBe('至少输入 2 个字');
    expect(getTimelineWarning(story)).toContain('重复');
  });

  it('rejects corrupt persisted documents', () => {
    expect(sanitizeStory('{bad json}')).toBeNull();
    expect(sanitizeStory({ version: 99 })).toBeNull();
    expect(sanitizeStory(createStarterStory())).not.toBeNull();
  });

  it('reconciles the selected scene with the visible list', () => {
    const story = createStarterStory();
    const [a, b] = story.scenes;
    // 当前选中项仍可见 → 保留
    expect(reconcileSceneSelection(a.id, [a, b], b.id)).toBe(a.id);
    // 当前选中项被过滤掉 → 收敛到第一个可见场景
    expect(reconcileSceneSelection(a.id, [b], b.id)).toBe(b.id);
    // 当前选中项被过滤掉且没有可见场景 → 清空
    expect(reconcileSceneSelection(a.id, [], '')).toBe('');
    // 当前是显式空值（占位项）→ 保留空值，不覆盖
    expect(reconcileSceneSelection('', [a, b], a.id)).toBe('');
  });
});
