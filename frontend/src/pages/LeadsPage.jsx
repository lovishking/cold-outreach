import { useState, useEffect } from 'react';
import { getLeads, createLead, deleteLead, uploadLeads, deleteLeadsBulk } from '../services/api';
import { Plus, X, Users, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ name: '', company: '', email: '' });
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('FULL'); // 'FULL', 'COMPANY_ONLY', 'NAME_ONLY'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const loadLeads = () => getLeads().then(res => setLeads(res.data)).catch(console.error);

  useEffect(() => { loadLeads() }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await createLead(form);
    setForm({ name: '', company: '', email: '' });
    setShowForm(false);
    loadLeads();
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await uploadLeads(formData);
    setFile(null);
    setShowForm(false);
    loadLeads();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all currently filtered leads (across all pages)
      const newLeadIds = new Set([...selectedLeadIds, ...filteredLeads.map(l => l.id)]);
      setSelectedLeadIds(newLeadIds);
    } else {
      // Deselect all currently filtered leads
      const filteredIds = new Set(filteredLeads.map(l => l.id));
      const newLeadIds = new Set([...selectedLeadIds].filter(id => !filteredIds.has(id)));
      setSelectedLeadIds(newLeadIds);
    }
  };

  const toggleLeadSelection = (id) => {
    const newSelected = new Set(selectedLeadIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeadIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedLeadIds.size} leads?`)) {
      await deleteLeadsBulk(Array.from(selectedLeadIds));
      setSelectedLeadIds(new Set());
      loadLeads();
    }
  };

  const totalLeads = leads.length;
  const sentLeadsCount = leads.filter(l => l.status === 'SENT').length;
  const pendingLeadsCount = leads.filter(l => l.status !== 'SENT').length;

  const fullLeadsCount = leads.filter(l => l.name && l.company).length;
  const nameOnlyLeadsCount = leads.filter(l => l.name && !l.company).length;
  const companyOnlyLeadsCount = leads.filter(l => !l.name && l.company).length;

  const filteredLeads = leads
    .filter(l => {
      if (statusFilter === 'SENT') return l.status === 'SENT';
      if (statusFilter === 'PENDING') return l.status !== 'SENT';
      if (statusFilter === 'FULL') return l.name && l.company;
      if (statusFilter === 'NAME_ONLY') return l.name && !l.company;
      if (statusFilter === 'COMPANY_ONLY') return !l.name && l.company;
      return true;
    })
    .filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isAllCurrentSelected = currentLeads.length > 0 && currentLeads.every(l => selectedLeadIds.has(l.id));

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Leads Management</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-slate-900/10 dark:shadow-white/10 active:scale-[0.98]"
        >
          {showForm ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
          {showForm ? 'Cancel' : 'Add Leads'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-6 transition-colors">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Leads</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalLeads}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-6 transition-colors">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Emails Sent</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{sentLeadsCount}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-6 transition-colors">
          <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <Clock size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Left to Send</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{pendingLeadsCount}</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Add Lead Manually</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500" placeholder="Company Name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} required />
              <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500" type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <button className="bg-blue-600 text-white px-4 py-3 rounded-xl mt-2 hover:bg-blue-700 font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]">Add Lead</button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Upload CSV File</h3>
            
            {/* Upload Type Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full mb-6">
              <button 
                onClick={() => setUploadType('FULL')} 
                className={`flex-1 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${uploadType === 'FULL' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Name & Company
              </button>
              <button 
                onClick={() => setUploadType('COMPANY_ONLY')} 
                className={`flex-1 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${uploadType === 'COMPANY_ONLY' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Company Only
              </button>
              <button 
                onClick={() => setUploadType('NAME_ONLY')} 
                className={`flex-1 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${uploadType === 'NAME_ONLY' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Name Only
              </button>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors group flex-1">
                <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-500/10 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-500/20 transition-all cursor-pointer outline-none" />
              </div>
              <button onClick={handleUpload} disabled={!file} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl mt-2 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-md shadow-slate-900/10 dark:shadow-white/10 active:scale-[0.98]">Upload Leads</button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-5 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
              CSV must contain headers: 
              {uploadType === 'FULL' && <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">name, company, email</code>}
              {uploadType === 'COMPANY_ONLY' && <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">company, email</code>}
              {uploadType === 'NAME_ONLY' && <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">name, email</code>}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden transition-colors border border-slate-200 dark:border-slate-800">

        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col xl:flex-row justify-between gap-4 xl:items-center">
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full xl:w-auto gap-1">
            <button onClick={() => setStatusFilter('ALL')} className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              All ({totalLeads})
            </button>
            <button onClick={() => setStatusFilter('PENDING')} className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${statusFilter === 'PENDING' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Pending ({pendingLeadsCount})
            </button>
            <button onClick={() => setStatusFilter('SENT')} className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${statusFilter === 'SENT' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Sent ({sentLeadsCount})
            </button>
            <div className="w-full sm:w-px h-px sm:h-auto bg-slate-200 dark:bg-slate-800 my-1 sm:my-0 sm:mx-1"></div>
            <button onClick={() => setStatusFilter('FULL')} className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${statusFilter === 'FULL' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Full ({fullLeadsCount})
            </button>
            <button onClick={() => setStatusFilter('COMPANY_ONLY')} className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${statusFilter === 'COMPANY_ONLY' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Company Only ({companyOnlyLeadsCount})
            </button>
            <button onClick={() => setStatusFilter('NAME_ONLY')} className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${statusFilter === 'NAME_ONLY' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Name Only ({nameOnlyLeadsCount})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedLeadIds.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                <Trash2 size={16} strokeWidth={2.5} /> Delete {selectedLeadIds.size}
              </button>
            )}
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full sm:w-72 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 transition-colors uppercase text-[10px] font-bold tracking-wider">
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="p-5 w-10">
                  <input 
                    type="checkbox" 
                    checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-transparent dark:border-slate-500 cursor-pointer"
                    title="Select all filtered leads"
                  />
                </th>
                <th className="py-5 pr-5">Name</th>
                <th className="p-5">Company</th>
                <th className="p-5">Email</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-900 dark:text-slate-100 divide-y divide-slate-100 dark:divide-slate-800/60">
              {currentLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedLeadIds.has(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-transparent dark:border-slate-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-5 pr-5 font-bold">{lead.name}</td>
                  <td className="p-5 text-slate-600 dark:text-slate-400 font-medium">{lead.company}</td>
                  <td className="p-5 text-slate-500 dark:text-slate-500 font-medium">{lead.email}</td>
                  <td className="p-5">
                    <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold tracking-wide uppercase ${
                      lead.status === 'SENT' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                      lead.status === 'PENDING' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button
                      onClick={async () => { if(window.confirm('Are you sure you want to delete this lead?')) { await deleteLead(lead.id); loadLeads(); } }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold transition-all text-xs bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {currentLeads.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Showing <span className="text-slate-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="text-slate-900 dark:text-white">{filteredLeads.length}</span> leads
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
