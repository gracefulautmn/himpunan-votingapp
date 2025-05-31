// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import Head from 'next/head';
// import Link from 'next/link';
// import { supabase } from '../../utils/supabaseClient';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { UserCircle, LogOut, Users, BarChart2, ArrowLeft, DownloadCloud } from 'lucide-react';

// function AdminResults() {
//   const [results, setResults] = useState([]);
//   const [totalVotes, setTotalVotes] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const isAdmin = localStorage.getItem('isAdmin') === 'true';
//     if (!isAdmin) {
//       router.push('/admin/login');
//     } else {
//       fetchResults();
//       const subscription = subscribeToVotes();
//       return () => {
//         subscription();
//       };
//     }
//   }, [router]);

//   const fetchResults = async () => {
//     setLoading(true);
//     try {
//       const { data: candidates, error: candidatesError } = await supabase
//         .from('candidates')
//         .select('id, ketua, wakil');

//       if (candidatesError) throw candidatesError;

//       const resultsWithVotes = await Promise.all(
//         candidates.map(async (candidate) => {
//           const { count, error: votesError } = await supabase
//             .from('votes')
//             .select('*', { count: 'exact', head: true })
//             .eq('candidate_id', candidate.id);

//           if (votesError) throw votesError;

//           return {
//             ...candidate,
//             votes: count || 0
//           };
//         })
//       );

//       const sortedResultsWithVotes = resultsWithVotes.sort((a, b) => b.votes - a.votes);

//       const total = sortedResultsWithVotes.reduce((sum, item) => sum + item.votes, 0);

//       const formattedResults = sortedResultsWithVotes.map(item => ({
//         name: `${item.ketua} - ${item.wakil}`,
//         votes: item.votes,
//         ketua: item.ketua,
//         wakil: item.wakil,
//         percentage: total ? ((item.votes / total) * 100).toFixed(1) : 0
//       }));

//       setResults(formattedResults);
//       setTotalVotes(total);
//     } catch (error) {
//       console.error("Error fetching results:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const subscribeToVotes = () => {
//     const channel = supabase
//       .channel('public:votes')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, (payload) => {
//         fetchResults();
//       })
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   };

//   const handleExportResults = () => {
//     const headers = ['No', 'Kandidat', 'Jumlah Suara', 'Persentase'];
//     const rows = results.map((result, index) => [
//       index + 1,
//       `${result.ketua} - ${result.wakil}`,
//       result.votes,
//       `${result.percentage}%`
//     ]);

//     rows.push(['', 'Total', totalVotes, totalVotes > 0 ? '100%' : '0%']);

//     const csvContent = [
//       headers.join(','),
//       ...rows.map(row => row.join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', `hasil-voting-${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('isAdmin');
//     router.push('/admin/login');
//   };

//   const CustomTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
//           <p className="font-bold">{payload[0].payload.name}</p>
//           <p className="text-blue-600">{`Jumlah Suara: ${payload[0].value}`}</p>
//           <p className="text-green-600">{`Persentase: ${payload[0].payload.percentage}%`}</p>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <>
//       <Head>
//         <title>Hasil Voting | Admin</title>
//         <meta name="description" content="Hasil Voting dalam Sistem Pemilihan" />
//       </Head>

//       <div className="flex min-h-screen bg-gray-100">
//         <div className="w-64 bg-blue-800 text-white flex flex-col">
//           <div className="p-4">
//             <h2 className="text-2xl font-bold text-center">Admin Panel</h2>
//             <div className="flex justify-center mt-4">
//               <UserCircle size={64} />
//             </div>
//             <p className="mt-2 text-center">Selamat datang, Admin!</p>
//           </div>

//           <nav className="mt-8 flex-grow">
//             <Link href="/admin/dashboard" className="flex items-center px-4 py-3 hover:bg-blue-700 transition-colors">
//               <div className="flex items-center space-x-2">
//                 <BarChart2 size={20} />
//                 <span>Dashboard</span>
//               </div>
//             </Link>
//             <Link href="/admin/candidates" className="flex items-center px-4 py-3 hover:bg-blue-700 transition-colors">
//               <div className="flex items-center space-x-2">
//                 <Users size={20} />
//                 <span>Kelola Kandidat</span>
//               </div>
//             </Link>
//             <Link href="/admin/programs" className="flex items-center px-4 py-3 hover:bg-blue-700 transition-colors">
//               <div className="flex items-center space-x-2">
//                 <Users size={20} /> 
//                 <span>Kelola Program Studi</span>
//               </div>
//             </Link>
//             <Link href="/admin/results" className="flex items-center px-4 py-3 bg-blue-900">
//               <div className="flex items-center space-x-2">
//                 <BarChart2 size={20} />
//                 <span>Hasil Voting</span>
//               </div>
//             </Link>
//           </nav>

//           <div className="p-4">
//             <button
//               onClick={handleLogout}
//               className="flex items-center justify-center w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
//             >
//               <LogOut size={16} className="mr-2" />
//               <span>Logout</span>
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 p-8">
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h1 className="text-2xl font-bold">Hasil Voting</h1>
//               <div className="flex space-x-4">
//                 <button
//                   onClick={handleExportResults}
//                   className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
//                 >
//                   <DownloadCloud size={16} className="mr-2" />
//                   Export CSV
//                 </button>
//                 <Link
//                   href="/admin/dashboard"
//                   className="flex items-center text-blue-600 hover:text-blue-800"
//                 >
//                   <ArrowLeft size={16} className="mr-1" />
//                   <span>Kembali ke Dashboard</span>
//                 </Link>
//               </div>
//             </div>

//             {loading ? (
//               <div className="flex justify-center py-12">
//                 <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//               </div>
//             ) : results.length === 0 ? (
//               <div className="text-center py-12 bg-gray-50 rounded-lg">
//                  <BarChart2 size={48} className="mx-auto text-gray-400 mb-4" />
//                 <p className="text-gray-500 text-lg">Belum ada data voting yang tersedia.</p>
//                  <p className="text-gray-400">Hasil akan muncul di sini setelah vote masuk.</p>
//               </div>
//             ) : (
//               <div>
//                 <div className="bg-blue-50 p-4 rounded-lg mb-6">
//                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
//                     <h2 className="text-lg font-semibold text-blue-800 mb-2 sm:mb-0">Total Suara Masuk: {totalVotes}</h2>
//                     <p className="text-gray-600 text-sm">Data diperbarui secara real-time</p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//                   {results.map((result, index) => (
//                     <div key={index} className={`bg-white border border-gray-200 rounded-lg shadow-sm p-5 ${index === 0 && result.votes > 0 ? 'ring-2 ring-green-500' : ''}`}>
//                       <div className="flex justify-between items-start mb-2">
//                         <h3 className="font-bold text-lg text-gray-800">{result.name}</h3>
//                         {index === 0 && result.votes > 0 && (
//                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
//                             Peringkat 1
//                           </span>
//                         )}
//                       </div>
//                       <div className="flex items-center my-3">
//                         <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
//                           <div
//                             className={`h-4 rounded-full ${index === 0 && result.votes > 0 ? 'bg-green-500' : 'bg-blue-600'}`}
//                             style={{ width: `${result.percentage}%` }}
//                           ></div>
//                         </div>
//                         <span className="font-medium text-gray-700 text-sm">{result.percentage}%</span>
//                       </div>
//                       <p className="text-gray-600">Jumlah Suara: <span className="font-semibold">{result.votes}</span></p>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 h-96 mb-8">
//                   <h3 className="font-bold text-gray-800 text-lg mb-4">Distribusi Suara</h3>
//                   <ResponsiveContainer width="100%" height="90%">
//                     <BarChart
//                       data={results}
//                       margin={{ top: 5, right: 20, left: -20, bottom: 75 }}
//                     >
//                       <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
//                       <XAxis
//                         dataKey="name"
//                         tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fill: '#4b5563' }}
//                         height={80}
//                         interval={0}
//                         stroke="#d1d5db"
//                       />
//                       <YAxis stroke="#d1d5db" tick={{ fontSize: 12, fill: '#4b5563' }} />
//                       <Tooltip content={<CustomTooltip />} />
//                       <Legend wrapperStyle={{ fontSize: '14px' }} />
//                       <Bar dataKey="votes" name="Jumlah Suara" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={results.length > 5 ? 30 : 50}/>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>

//                 <div className="mt-8">
//                   <h2 className="text-xl font-semibold mb-4 text-gray-800">Rincian Hasil Voting</h2>
//                   <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peringkat</th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pasangan Kandidat</th>
//                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Suara</th>
//                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Persentase</th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {results.map((result, index) => (
//                           <tr key={index} className={`hover:bg-gray-50 ${index === 0 && result.votes > 0 ? 'bg-green-50' : ''}`}>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{result.name}</td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{result.votes}</td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
//                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                                 index === 0 && result.votes > 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
//                               }`}>
//                                 {result.percentage}%
//                               </span>
//                             </td>
//                           </tr>
//                         ))}
//                         {results.length > 0 && (
//                             <tr className="bg-gray-50 font-semibold">
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" colSpan={2}>Total</td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">{totalVotes}</td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">{totalVotes > 0 ? '100%' : '0%'}</td>
//                             </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default AdminResults;