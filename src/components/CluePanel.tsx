import { useEffect, useState } from 'react';
import type { StoryScene } from '../models/story';
import { reconcileSceneSelection } from '../models/storyRules';
import type { StoryViewModel } from '../viewmodels/storyViewModel';

interface CluePanelProps { viewModel: StoryViewModel; scenes: StoryScene[]; }

export function CluePanel({ viewModel, scenes }: CluePanelProps) {
  const [title, setTitle] = useState('');
  const [setup, setSetup] = useState(scenes[0]?.id ?? '');
  const [payoff, setPayoff] = useState('');
  const story = viewModel.snapshot.story;

  // 顶部搜索会过滤场景列表：已选的埋下场景若不再可见，就收敛到第一个可见场景，
  // 列表为空则清空；回收场景是可选项，一旦不可见就作废回到“稍后回收”。
  // 绝不能拿着看不见的场景 id 提交。
  useEffect(() => {
    setSetup((current) => reconcileSceneSelection(current, scenes, scenes[0]?.id ?? ''));
  }, [scenes]);
  useEffect(() => {
    setPayoff((current) => reconcileSceneSelection(current, scenes, ''));
  }, [scenes]);

  const submit = () => { viewModel.addClue(title, setup, payoff); setTitle(''); };

  // 伏笔记录里的场景名要从完整故事列表取，不能只看当前搜索过滤后的列表，
  // 否则埋下场景被过滤掉时会错误地显示成“未知场景”。
  const sceneTitle = (sceneId: string) => story?.scenes.find((scene) => scene.id === sceneId)?.title ?? '未知场景';

  return (
    <section className="panel clue-panel">
      <div className="panel-heading"><div><span className="eyebrow">THREADS / 叙事线索</span><h2>伏笔关系</h2></div><span className="unresolved"><i /> {viewModel.snapshot.stats.unresolvedClues} 个待回收</span></div>
      <div className="clue-list">
        {story?.clues.map((clue) => (
          <div className="clue-row" key={clue.id}>
            <span className="clue-symbol">⌁</span>
            <div>
              <strong>{clue.title}</strong>
              <span>{sceneTitle(clue.setupSceneId)} <b>→</b> {clue.payoffSceneId ? sceneTitle(clue.payoffSceneId) : '待回收'}</span>
            </div>
            <em className={clue.payoffSceneId ? 'resolved' : ''}>{clue.payoffSceneId ? '已回收' : '未回收'}</em>
          </div>
        ))}
      </div>
      <div className="clue-form">
        <input aria-label="伏笔名称" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="伏笔名称，例如：罗盘上的刻痕" />
        <select aria-label="埋下场景" value={setup} onChange={(event) => setSetup(event.target.value)}>
          <option value="">埋下场景…</option>
          {scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.title}</option>)}
        </select>
        <select aria-label="回收场景" value={payoff} onChange={(event) => setPayoff(event.target.value)}>
          <option value="">回收场景（稍后）</option>
          {scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.title}</option>)}
        </select>
        <button onClick={submit}>建立关系</button>
      </div>
    </section>
  );
}
