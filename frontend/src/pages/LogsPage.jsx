import { useState, useEffect } from 'react';
import { getLogs } from '../services/api';
import { format, isToday, isYesterday, isAfter, subDays } from 'date-fns';
import { Calendar, Filter } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadLogs = () => {
    getLogs().then(res => setLogs(res.data)).catch(console.error);
  };
  
  useEffect(() => { 
    loadLogs();
    const interval = setInterval(loadLogs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'SENT': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/50';
      case 'FAILED': 
      case 'BOUNCED': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/50';
      case 'RETRYING': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-800/50';
      case 'SENDING': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
    }
  };

  const filteredLogs = logs.filter(log => {
    // 1. Status Filter
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;

    // 2. Date Filter
    if (dateFilter === 'ALL') return true;
    
    const logDate = new Date(log.created_at + 'Z');
    const now = new Date();

    if (dateFilter === 'TODAY') return isToday(logDate);
    if (dateFilter === 'YESTERDAY') return isYesterday(logDate);
    if (dateFilter === 'LAST_7') return isAfter(logDate, subDays(now, 7));
    if (dateFilter === 'LAST_30') return isAfter(logDate, subDays(now, 30));
    
    return true;
  });

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Email Logs</h2>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden transition-colors border border-slate-200 dark:border-slate-800">
        
        {/* Advanced Filters Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="pl-3 text-slate-400 dark:text-slate-500">
              <Calendar size={18} strokeWidth={2.5} />
            </div>
            <select 
              className="w-full sm:w-48 bg-transparent text-slate-900 dark:text-white py-2 pr-4 focus:outline-none text-sm font-bold cursor-pointer"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="ALL" className="dark:bg-slate-900">All Time</option>
              <option value="TODAY" className="dark:bg-slate-900">Today</option>
              <option value="YESTERDAY" className="dark:bg-slate-900">Yesterday</option>
              <option value="LAST_7" className="dark:bg-slate-900">Last 7 Days</option>
              <option value="LAST_30" className="dark:bg-slate-900">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="pl-3 text-slate-400 dark:text-slate-500">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <select 
              className="w-full sm:w-48 bg-transparent text-slate-900 dark:text-white py-2 pr-4 focus:outline-none text-sm font-bold cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL" className="dark:bg-slate-900">All Statuses</option>
              <option value="SENT" className="dark:bg-slate-900">Sent</option>
              <option value="PENDING" className="dark:bg-slate-900">Pending</option>
              <option value="SENDING" className="dark:bg-slate-900">Sending</option>
              <option value="FAILED" className="dark:bg-slate-900">Failed</option>
              <option value="BOUNCED" className="dark:bg-slate-900">Bounced</option>
              <option value="RETRYING" className="dark:bg-slate-900">Retrying</option>
            </select>
          </div>
          
          <div className="ml-auto text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            Showing <span className="text-blue-600 dark:text-blue-400">{filteredLogs.length}</span> logs
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 transition-colors uppercase text-[10px] font-bold tracking-wider">
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="p-5">Timestamp</th>
                <th className="p-5">Subject</th>
                <th className="p-5">Status</th>
                <th className="p-5">Retries</th>
                <th className="p-5">Error Details</th>
              </tr>
            </thead>
            <tbody className="text-slate-900 dark:text-slate-100 divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                    {format(new Date(log.created_at + 'Z'), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="p-5 font-bold text-slate-900 dark:text-slate-200">{log.subject || '-'}</td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-slate-500 dark:text-slate-400">{log.retry_count}</td>
                  <td className="p-5 text-red-500 dark:text-red-400 max-w-xs truncate font-medium" title={log.error_message}>{log.error_message || '-'}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
