import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, GitBranch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FMSStep } from '../types';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

export default function CreateFMS() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fmsName, setFmsName] = useState('');
  const [steps, setSteps] = useState<FMSStep[]>([
    { stepNo: 1, what: '', who: '', how: '', when: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDiagram, setShowDiagram] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (showDiagram && steps.every(s => s.what)) {
      generateDiagram();
    }

    // Load users for WHO dropdown
    loadUsers();
  }, [showDiagram, steps]);

  const loadUsers = async () => {
    try {
      const response = await api.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const generateDiagram = async () => {
    const mermaidCode = `
graph LR
    Start([Start])
    ${steps.map((step, idx) => `
    Step${idx + 1}["Step ${step.stepNo}<br/>WHAT: ${step.what}<br/>WHO: ${step.who}<br/>HOW: ${step.how}<br/>WHEN: ${step.when} days"]
    `).join('\n')}
    End([End])

    Start --> Step1
    ${steps.map((_, idx) =>
      idx < steps.length - 1 ? `Step${idx + 1} --> Step${idx + 2}` : `Step${idx + 1} --> End`
    ).join('\n')}

    style Start fill:#10b981,stroke:#059669,color:#fff
    style End fill:#ef4444,stroke:#dc2626,color:#fff
    ${steps.map((_, idx) => `style Step${idx + 1} fill:#3b82f6,stroke:#2563eb,color:#fff`).join('\n')}
    `;

    try {
      const { svg } = await mermaid.render('fms-diagram', mermaidCode);
      setDiagramSvg(svg);
    } catch (err) {
      console.error('Mermaid rendering error:', err);
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      { stepNo: steps.length + 1, what: '', who: '', how: '', when: 1 },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      newSteps.forEach((step, idx) => {
        step.stepNo = idx + 1;
      });
      setSteps(newSteps);
    }
  };

  const updateStep = (index: number, field: keyof FMSStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fmsName.trim()) {
      setError('Please enter FMS name');
      return;
    }

    const hasEmptyFields = steps.some(
      step => !step.what.trim() || !step.who.trim() || !step.how.trim()
    );

    if (hasEmptyFields) {
      setError('Please fill in all step fields');
      return;
    }

    setLoading(true);

    try {
      const result = await api.createFMS(fmsName, steps, user!.username);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Failed to create FMS');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <GitBranch className="w-6 h-6 sm:w-8 sm:h-8" />
          Create FMS Template
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              FMS Name
            </label>
            <input
              type="text"
              value={fmsName}
              onChange={(e) => setFmsName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none text-sm sm:text-base"
              placeholder="Enter FMS template name"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Steps</h2>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Step {step.stepNo}</h3>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WHAT (Task Description)
                    </label>
                    <input
                      type="text"
                      value={step.what}
                      onChange={(e) => updateStep(index, 'what', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      placeholder="What needs to be done?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WHO (Responsible User)
                    </label>
                    <select
                      value={step.who}
                      onChange={(e) => updateStep(index, 'who', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.username} value={user.username}>
                          {user.name} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      HOW (Method/Process)
                    </label>
                    <input
                      type="text"
                      value={step.how}
                      onChange={(e) => updateStep(index, 'how', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      placeholder="How will it be done?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WHEN (Duration in days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={step.when}
                      onChange={(e) => updateStep(index, 'when', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={addStep}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setShowDiagram(!showDiagram)}
              disabled={!steps.every(s => s.what)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
              {showDiagram ? 'Hide' : 'Show'} Flowchart
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'Saving...' : 'Save FMS Template'}
            </button>
          </div>
        </form>
      </div>

      {showDiagram && diagramSvg && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Flow Diagram</h2>
          <div
            className="flex justify-center overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: diagramSvg }}
          />
        </div>
      )}
    </div>
  );
}
