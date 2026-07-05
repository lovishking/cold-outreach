import { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, uploadAttachment, deleteTemplate } from '../services/api';
import { Paperclip, Plus, X, LayoutTemplate, Trash2, Edit2 } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', subject: '', body: '', attachment_path: null });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadTemplates = () => getTemplates().then(res => setTemplates(res.data)).catch(console.error);
  
  useEffect(() => { loadTemplates() }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let new_attachment_path = form.attachment_path;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadAttachment(formData);
        new_attachment_path = res.data.file_path;
      }
      
      const payload = {
        name: form.name,
        subject: form.subject,
        body: form.body,
        attachment_path: new_attachment_path
      };

      if (form.id) {
        await updateTemplate(form.id, payload);
      } else {
        await createTemplate(payload);
      }
      
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error("Failed to save template", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (tpl) => {
    setForm({ 
      id: tpl.id, 
      name: tpl.name, 
      subject: tpl.subject, 
      body: tpl.body, 
      attachment_path: tpl.attachment_path 
    });
    setFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this template? Any running campaigns using it might fail.")) {
      try {
        await deleteTemplate(id);
        loadTemplates();
      } catch (error) {
        console.error("Failed to delete template", error);
        alert("Failed to delete template.");
      }
    }
  };

  const resetForm = () => {
    setForm({ id: null, name: '', subject: '', body: '', attachment_path: null });
    setFile(null);
    setShowForm(false);
    const fileInput = document.getElementById('attachment-upload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Templates</h2>
        <button 
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-slate-900/10 dark:shadow-white/10 active:scale-[0.98]"
        >
          {showForm ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
          {showForm ? 'Cancel' : 'New Template'}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm mb-8 transition-all border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {form.id ? 'Edit Template' : 'Create New Template'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Personalize emails using variables: 
                <code className="mx-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono">{'{{name}}'}</code> 
                <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono">{'{{company}}'}</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Template Name</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                  placeholder="e.g. Initial Outreach v1" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Subject</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                  placeholder="e.g. Quick question for {{company}}" 
                  value={form.subject} 
                  onChange={e => setForm({...form, subject: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Body</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl h-48 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-y" 
                placeholder="Hi {{name}},&#10;&#10;I noticed {{company}} is growing..." 
                value={form.body} 
                onChange={e => setForm({...form, body: e.target.value})} 
                required 
              />
            </div>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-6 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Paperclip size={18} className="text-slate-500" />
                  Attach Document (Optional)
                </label>
                {form.attachment_path && !file && (
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-3 py-1 rounded-lg">
                    Current: {form.attachment_path.replace('attachments/', '')}
                  </span>
                )}
              </div>
              <input 
                id="attachment-upload"
                type="file" 
                onChange={e => setFile(e.target.files[0])} 
                className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-500/10 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-500/20 transition-all cursor-pointer outline-none"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium ml-1">Uploading a new file will replace the current attachment.</p>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button 
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isUploading} 
                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center gap-2"
              >
                {isUploading ? 'Saving...' : form.id ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {templates.length === 0 && !showForm ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutTemplate size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No templates yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Create your first template to start sending campaigns.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            + Create Template
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden transition-colors border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 transition-colors uppercase text-[10px] font-bold tracking-wider">
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="p-5">Template Name</th>
                  <th className="p-5">Subject Line</th>
                  <th className="p-5">Body Preview</th>
                  <th className="p-5">Attachment</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-900 dark:text-slate-100 divide-y divide-slate-100 dark:divide-slate-800/60">
                {templates.map(tpl => (
                  <tr key={tpl.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5 font-bold whitespace-nowrap">{tpl.name}</td>
                    <td className="p-5 text-slate-600 dark:text-slate-400 font-medium max-w-[200px] truncate" title={tpl.subject}>{tpl.subject}</td>
                    <td className="p-5 text-slate-500 dark:text-slate-500 font-medium max-w-xs truncate" title={tpl.body}>{tpl.body.replace(/\n/g, ' ')}</td>
                    <td className="p-5">
                      {tpl.attachment_path ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-2.5 py-1.5 rounded-lg font-bold max-w-[150px]" title={tpl.attachment_path.replace('attachments/', '')}>
                          <Paperclip size={14} className="shrink-0" />
                          <span className="truncate">{tpl.attachment_path.replace('attachments/', '')}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs font-bold px-2">-</span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => handleEdit(tpl)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-xs bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Edit2 size={14} strokeWidth={2.5} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(tpl.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-xs bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={14} strokeWidth={2.5} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}