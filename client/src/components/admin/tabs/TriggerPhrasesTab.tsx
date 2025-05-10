import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface TriggerPhrase {
  id: number;
  phrase: string;
  guidelines: string;
  personality: string;
  identity?: string;
  purpose?: string;
  audience?: string;
  task?: string;
  examples?: string;
  active: number;
}

const defaultForm: Partial<TriggerPhrase> = {
  phrase: '',
  guidelines: '',
  personality: '',
  identity: '',
  purpose: '',
  audience: '',
  task: '',
  examples: '',
  active: 1,
};

export default function TriggerPhrasesTab() {
  const [triggers, setTriggers] = useState<TriggerPhrase[]>([]);
  const [form, setForm] = useState<Partial<TriggerPhrase>>(defaultForm);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/trigger-phrases');
      setTriggers(data);
    } catch (err) {
      setError('Failed to load trigger phrases');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTriggers(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await axios.put(`/api/trigger-phrases/${editingId}`, form);
      } else {
        await axios.post('/api/trigger-phrases', form);
      }
      setForm(defaultForm);
      setEditingId(null);
      fetchTriggers();
    } catch (err) {
      setError('Failed to save trigger phrase');
    }
    setLoading(false);
  };

  const handleEdit = (trigger: TriggerPhrase) => {
    setForm(trigger);
    setEditingId(trigger.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this trigger phrase?')) return;
    setLoading(true);
    try {
      await axios.delete(`/api/trigger-phrases/${id}`);
      fetchTriggers();
    } catch {
      setError('Failed to delete trigger phrase');
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
        <h2 className="text-terminal-green text-xl mb-4">Trigger Phrase Management</h2>
        {error && <div className="text-terminal-pink mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <input
              name="phrase"
              placeholder="Trigger Phrase (e.g. theamal mode)"
              value={form.phrase || ''}
              onChange={handleChange}
              required
              className="flex-1 min-w-[200px] bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            />
            <input
              name="personality"
              placeholder="Personality Description"
              value={form.personality || ''}
              onChange={handleChange}
              required
              className="flex-1 min-w-[200px] bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            />
            <input
              name="identity"
              placeholder="Identity (Who am I?)"
              value={form.identity || ''}
              onChange={handleChange}
              className="flex-1 min-w-[200px] bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            />
            <input
              name="purpose"
              placeholder="Purpose (What is my purpose?)"
              value={form.purpose || ''}
              onChange={handleChange}
              className="flex-1 min-w-[200px] bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <input
              name="audience"
              placeholder="Audience (Who am I talking to?)"
              value={form.audience || ''}
              onChange={handleChange}
              className="flex-1 min-w-[200px] bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            />
            <input
              name="task"
              placeholder="Task (What is my task?)"
              value={form.task || ''}
              onChange={handleChange}
              className="flex-1 min-w-[200px] bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            />
          </div>
          <textarea
            name="guidelines"
            placeholder="Guidelines (one per line)"
            value={form.guidelines || ''}
            onChange={handleChange}
            required
            className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm mt-2"
          />
          <textarea
            name="examples"
            placeholder="Examples (optional)"
            value={form.examples || ''}
            onChange={handleChange}
            className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm mt-2"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center text-terminal-muted text-sm">
              <input
                type="checkbox"
                name="active"
                checked={form.active === 1}
                onChange={e => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
                className="mr-2 accent-terminal-green"
              />
              Active
            </label>
            <button
              type="submit"
              disabled={loading}
              className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-4 rounded text-sm transition-colors ml-2"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setForm(defaultForm); setEditingId(null); }}
                className="bg-terminal-muted hover:bg-terminal-orange text-white py-1 px-4 rounded text-sm transition-colors ml-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-terminal-bg">
                <th className="p-2 text-terminal-muted text-xs font-bold">ID</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Phrase</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Personality</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Identity</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Purpose</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Audience</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Task</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Guidelines</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Examples</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Active</th>
                <th className="p-2 text-terminal-muted text-xs font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {triggers.map(trigger => (
                <tr key={trigger.id} className="border-b border-terminal-muted hover:bg-terminal-bg/70">
                  <td className="p-2 text-xs text-terminal-text">{trigger.id}</td>
                  <td className="p-2 text-xs text-terminal-cyan font-mono break-all">{trigger.phrase}</td>
                  <td className="p-2 text-xs text-terminal-orange break-all">{trigger.personality}</td>
                  <td className="p-2 text-xs break-all">{trigger.identity}</td>
                  <td className="p-2 text-xs break-all">{trigger.purpose}</td>
                  <td className="p-2 text-xs break-all">{trigger.audience}</td>
                  <td className="p-2 text-xs break-all">{trigger.task}</td>
                  <td className="p-2 text-xs whitespace-pre-wrap break-words max-w-[200px]">{trigger.guidelines}</td>
                  <td className="p-2 text-xs whitespace-pre-wrap break-words max-w-[200px]">{trigger.examples}</td>
                  <td className="p-2 text-xs">
                    {trigger.active === 1 ? (
                      <span className="text-terminal-green font-bold">Yes</span>
                    ) : (
                      <span className="text-terminal-pink font-bold">No</span>
                    )}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(trigger)}
                      disabled={loading}
                      className="text-terminal-cyan text-xs hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(trigger.id)}
                      disabled={loading}
                      className="text-terminal-pink text-xs hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
