import React, { useState } from 'react';
import { workspaceAPI } from '../../api/workspaces.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export const WorkspaceModal = ({ isOpen, onClose, onCreated }) => {
  const { switchWorkspace, refreshWorkspaces } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await workspaceAPI.createWorkspace({
        name: name.trim(),
        description: description.trim()
      });

      await refreshWorkspaces();
      switchWorkspace(res.data);
      if (onCreated) onCreated(res.data);
      onClose();
      setName('');
      setDescription('');
    } catch (err) {
      alert(`Error creating workspace: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Workspace" subtitle="Create a new isolated collaborative space">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Acme Corp, Engineering Hub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="What is this workspace for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
