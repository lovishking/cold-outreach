import { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, getTemplates, getLeads, startCampaign, pauseCampaign, stopCampaign, resumeCampaign, getSenders, deleteCampaign } from '../services/api';
import { Plus, X, Play, Pause, Square, CheckSquare, Search, Trash2, Megaphone, Trash, RefreshCw } from 'lucide-react';

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [senders, setSenders] = useState([]);
  const [form, setForm] = useState({ name: '', template_id: '', sender_id: '', lead_ids: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [topN, setTopN] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadData = () => {
    getCampaigns().then(res => setCampaigns(res.data)).catch(console.error);
    getTemplates().then(res => setTemplates(res.data)).catch(console.error);
    getLeads().then(res => setLeads(res.data)).catch(console.error);
    getSenders().then(res => setSenders(res.data)).catch(console.error);
  };

  useEffect(() => { loadData() }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.template_id) return alert("Select a template");
    if (form.lead_ids.length === 0) return alert("Select at least one lead");
    
    // Parse sender_id if it's set
    const payload = { 
      ...form, 
      template_id: parseInt(form.template_id),
      sender_id: form.sender_id ? parseInt(form.sender_id) : null
    };

    await createCampaign(payload);
    setForm({ name: '', template_id: '', sender_id: '', lead_ids: [] });
    setShowForm(false);
    loadData();
  };

  const handleAction = async (id, action) => {
    if (action === 'start') await startCampaign(id);
    if (action === 'pause') await pauseCampaign(id);
    if (action === 'resume') await resumeCampaign(id);
    if (action === 'stop') await stopCampaign(id);
    if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this campaign? This will also delete all associated email logs.')) {
        await deleteCampaign(id);
      }
    }
    loadData();
  };

  const handleRelaunch = (c) => {
    setForm({ 
      name: `${c.name} (Relaunch)`, 
      template_id: c.template_id || '', 
      sender_id: c.sender_id || '', 
      lead_ids: [] 
    });
    setStatusFilter('PENDING'); // Auto-filter to show only pending leads
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalLeads = leads.length;
  const sentLeadsCount = leads.filter(l => l.status === 'SENT').length;
  const pendingLeadsCount = leads.filter(l => l.status !== 'SENT').length;

  const filteredLeads = leads
    .filter(l => {
      if (statusFilter === 'SENT') return l.status === 'SENT';
      if (statusFilter === 'PENDING') return l.status !== 'SENT';
      return true; // ALL
    })
    .filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newLeadIds = new Set([...form.lead_ids, ...filteredLeads.map(l => l.id)]);
      setForm({...form, lead_ids: Array.from(newLeadIds)});
    } else {
      const filteredIds = new Set(filteredLeads.map(l => l.id));
      const newLeadIds = form.lead_ids.filter(id => !filteredIds.has(id));
      setForm({...form, lead_ids: newLeadIds});
    }
  };

  const handleSelectTop = () => {
    const n = parseInt(topN, 10);
    if (!isNaN(n) && n > 0) {
      const idsToSelect = filteredLeads.slice(0, n).map(l => l.id);
      const newLeadIds = new Set([...form.lead_ids, ...idsToSelect]);
      setForm({...form, lead_ids: Array.from(newLeadIds)});
      setTopN(''); 
    }
  };

  const isAllFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => form.lead_ids.includes(l.id));

  const getLeadStatusColor = (status) => {
    switch(status) {
      case 'SENT': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800/50';
      case 'SENDING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
      case 'FAILED': 
      case 'BOUNCED': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800/50';
      case 'RETRYING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
    }
  };

  const getCampStatusColor = (status) => {
    switch(status) {
      case 'RUNNING': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
      case 'STOPPED': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      case 'FINISHED': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Campaigns</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-slate-900/10 dark:shadow-white/10 active:scale-[0.98]"
        >
          {showForm ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
          {showForm ? 'Cancel' : 'New Campaign'}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm mb-8 transition-all border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Campaign</h3>
          
          <form onSubmit={handleCreate} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Campaign Name</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                  placeholder="e.g. Q3 Outreach Phase 1" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Template</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium" 
                  value={form.template_id} 
                  onChange={e => setForm({...form, template_id: e.target.value})} 
                  required
                >
                  <option value="" className="dark:bg-slate-900">Select Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Sender Account</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium" 
                  value={form.sender_id} 
                  onChange={e => setForm({...form, sender_id: e.target.value})} 
                >
                  <option value="" className="dark:bg-slate-900">Use Default Account</option>
                  {senders.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.email}</option>)}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col transition-colors">
              
              {/* Segments & Quick Stats */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    All ({totalLeads})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${statusFilter === 'PENDING' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Pending ({pendingLeadsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('SENT')}
                    className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${statusFilter === 'SENT' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Sent ({sentLeadsCount})
                  </button>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto px-2 sm:px-0">
                  <Search size={18} className="text-slate-400 hidden sm:block" />
                  <input 
                    type="text" 
                    placeholder="Search leads by name..." 
                    className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm font-medium shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Tools Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isAllFilteredSelected} 
                      onChange={handleSelectAll} 
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-transparent dark:border-slate-600"
                    />
                    Select All {searchTerm && 'Filtered'}
                  </label>
                  
                  {form.lead_ids.length > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <CheckSquare size={14}/> {form.lead_ids.length} selected
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 px-2">Select top:</span>
                  <input 
                    type="number"
                    min="1"
                    placeholder="50"
                    value={topN}
                    onChange={e => setTopN(e.target.value)}
                    className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-2 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none text-center text-sm font-bold shadow-sm"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSelectTop())}
                  />
                  <button 
                    type="button"
                    onClick={handleSelectTop}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm px-4 py-1.5 rounded-lg transition-all font-bold shadow-sm active:scale-[0.97]"
                  >
                    Select
                  </button>
                  {form.lead_ids.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setForm({...form, lead_ids: []})}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                      title="Clear Selection"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>

              {/* Leads List */}
              <div className="h-72 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-950/30">
                {filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-bold">No leads found in this view.</p>
                  </div>
                ) : (
                  filteredLeads.map(l => (
                    <label key={l.id} className="flex items-center gap-4 p-3 hover:bg-white dark:hover:bg-slate-800/80 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm mb-1 group">
                      <input 
                        type="checkbox" 
                        checked={form.lead_ids.includes(l.id)} 
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...form.lead_ids, l.id] 
                            : form.lead_ids.filter(id => id !== l.id);
                          setForm({...form, lead_ids: ids});
                        }} 
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-transparent dark:border-slate-500"
                      />
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{l.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getLeadStatusColor(l.status)}`}>
                            {l.status}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{l.email}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]">
                Launch Campaign
              </button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0 && !showForm ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No campaigns yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Create your first campaign to start sending emails.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            + Create Campaign
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden transition-colors border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 transition-colors uppercase text-[10px] font-bold tracking-wider">
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="p-5">Campaign Name</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Emails Sent</th>
                  <th className="p-5">Left to Send</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-900 dark:text-slate-100 divide-y divide-slate-100 dark:divide-slate-800/60">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5 font-bold whitespace-nowrap">{c.name}</td>
                    <td className="p-5">
                      <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold tracking-wide uppercase ${getCampStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-5 text-slate-900 dark:text-white font-black text-lg">{c.emails_sent}</td>
                    <td className="p-5 text-blue-600 dark:text-blue-400 font-black text-lg">{c.emails_left || 0}</td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        {['DRAFT', 'STOPPED'].includes(c.status) && (
                          <button onClick={() => handleAction(c.id, 'start')} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-bold text-xs bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                            <Play size={14} fill="currentColor" /> Start
                          </button>
                        )}
                        {c.status === 'RUNNING' && (
                          <button onClick={() => handleAction(c.id, 'pause')} className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-bold text-xs bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                            <Pause size={14} fill="currentColor" /> Pause
                          </button>
                        )}
                        {c.status === 'PAUSED' && (
                          <button onClick={() => handleAction(c.id, 'resume')} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-xs bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                            <Play size={14} fill="currentColor" /> Resume
                          </button>
                        )}
                        {['RUNNING', 'PAUSED'].includes(c.status) && (
                          <button onClick={() => handleAction(c.id, 'stop')} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                            <Square size={14} fill="currentColor" /> Stop
                          </button>
                        )}
                        {['FINISHED', 'STOPPED'].includes(c.status) && (
                          <button 
                            onClick={() => handleRelaunch(c)} 
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold text-xs bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Relaunch as new campaign"
                          >
                            <RefreshCw size={14} strokeWidth={2.5} /> Relaunch
                          </button>
                        )}
                        <button 
                          onClick={() => handleAction(c.id, 'delete')}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-xs bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={14} strokeWidth={2.5} />
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
