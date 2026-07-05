import { useState, useEffect } from 'react';
import { getSenders, createSender, deleteSender, setSenderDefault } from '../services/api';
import { Mail, Key, Trash2, Star, Server, Plus, X } from 'lucide-react';

export default function SettingsPage() {
  const [senders, setSenders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_password: ''
  });

  const loadSenders = () => {
    getSenders().then(res => setSenders(res.data)).catch(console.error);
  };

  useEffect(() => { loadSenders(); }, []);

  const handleAddSender = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSender({ 
        email: form.email,
        smtp_server: form.smtp_server,
        smtp_port: parseInt(form.smtp_port),
        smtp_password: form.smtp_password
      });
      setForm({ email: '', smtp_server: 'smtp.gmail.com', smtp_port: 587, smtp_password: '' });
      setShowForm(false);
      loadSenders();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to add sender account. Make sure it is a valid email format.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sender account?")) {
      await deleteSender(id);
      loadSenders();
    }
  };

  const handleSetDefault = async (id) => {
    await setSenderDefault(id);
    loadSenders();
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Email Accounts</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-slate-900/10 dark:shadow-white/10 active:scale-[0.98]"
        >
          {showForm ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm mb-8 transition-all border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect New Sender Account</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Use App Passwords for Gmail or Microsoft instead of your primary login password.</p>
          
          <form onSubmit={handleAddSender} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Mail size={16} /> Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium" 
                  placeholder="e.g. outreach@yourdomain.com" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Key size={16} /> App Password</label>
                <input 
                  type="password"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium font-mono" 
                  placeholder="••••••••••••" 
                  value={form.smtp_password} 
                  onChange={e => setForm({...form, smtp_password: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Server size={16} /> SMTP Server</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium" 
                  placeholder="smtp.gmail.com" 
                  value={form.smtp_server} 
                  onChange={e => setForm({...form, smtp_server: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">SMTP Port</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium" 
                  placeholder="587" 
                  value={form.smtp_port} 
                  onChange={e => setForm({...form, smtp_port: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting} 
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
              >
                {isSubmitting ? 'Connecting...' : 'Connect Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {senders.length === 0 && !showForm ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No email accounts connected</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Add a sender email address to start launching campaigns.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            + Connect Email Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {senders.map(sender => (
            <div key={sender.id} className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border hover:shadow-md transition-all flex flex-col overflow-hidden ${sender.is_default ? 'border-blue-400 dark:border-blue-500/50 shadow-blue-100 dark:shadow-blue-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Mail size={20} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate tracking-tight">{sender.email}</h4>
                </div>
                {sender.is_default && (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-3 py-1.5 rounded-lg font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <Star size={14} fill="currentColor" /> Active Default
                  </span>
                )}
              </div>
              
              <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Server</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white truncate">{sender.smtp_server}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Port</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{sender.smtp_port}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 px-6 py-4 flex justify-between items-center">
                {!sender.is_default ? (
                  <button 
                    onClick={() => handleSetDefault(sender.id)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-all text-sm"
                  >
                    <Star size={16} /> Set as Default
                  </button>
                ) : (
                  <div></div> /* Empty div to keep flex-justify space-between aligned */
                )}

                <button 
                  onClick={() => handleDelete(sender.id)} 
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-bold transition-all bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-xl"
                >
                  <Trash2 size={16} strokeWidth={2.5} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}