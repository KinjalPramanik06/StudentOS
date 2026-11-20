import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import writeExcelFile from 'write-excel-file/browser';
import { AttendanceRecord, AttendanceLedgerEntry, UserProfile } from '../types';
import { MIN_SUBJECT_ATTENDANCE_PERCENT, getSubjectAttendance } from './attendanceThreshold';

export interface ExportDataParams {
  student: UserProfile;
  attendanceRecords: AttendanceRecord[];
  ledgerEntries: AttendanceLedgerEntry[];
  semester: number;
}

export function attendanceExportStatus(status: AttendanceLedgerEntry['status']): string {
  if (status === 'Off') return 'OFF CLASS';
  if (status === 'Event') return 'EVENT / EXAM CLASS';
  if (status === 'Holiday') return 'HOLIDAY CLASS';
  return status.toUpperCase();
}

// Exports list class entries (Present, Absent, Off, Event/Exam), newest first.
// Holiday and Reset entries are left out.
export function classAttendanceEntries(entries: AttendanceLedgerEntry[]): AttendanceLedgerEntry[] {
  return entries
    .filter((entry) => entry.status !== 'Holiday' && entry.status !== 'Reset')
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const byDate = String(b.entry.date).localeCompare(String(a.entry.date));
      return byDate !== 0 ? byDate : b.index - a.index;
    })
    .map(({ entry }) => entry);
}

// 1. Export as PDF
export function exportAttendancePDF({ student, attendanceRecords, ledgerEntries: allLedgerEntries, semester }: ExportDataParams) {
  const ledgerEntries = classAttendanceEntries(allLedgerEntries);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 118, 110]; // Emerald teal #0f766e
  const darkColor = [30, 41, 59]; // Slate 800

  // Header Banner
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('STUDENTOS ATTENDANCE REPORT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Official Student Attendance Ledger & Condonation Report', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 145, 18);

  // Student Details Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 32, 182, 26, 3, 3, 'FD');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Student: ${student.name || 'Student'}`, 18, 40);
  doc.text(`Roll No: ${student.rollNumber || 'N/A'}`, 18, 47);
  doc.text(`Reg No: ${student.regNumber || 'N/A'}`, 18, 54);

  doc.text(`Dept: ${student.department || 'Computer Science'}`, 110, 40);
  doc.text(`Semester: ${semester}`, 110, 47);
  doc.text(`Section: ${student.section || 'CSE A'}`, 110, 54);

  // Table 1: Subject Summary Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. Subject-Wise Attendance Summary', 14, 66);

  const summaryRows = attendanceRecords.map((rec) => {
    const { held, present, percentage, belowMinimum } = getSubjectAttendance(rec);
    const statusText = percentage === null
      ? 'NO CLASSES RECORDED'
      : belowMinimum ? `BELOW MINIMUM (<${MIN_SUBJECT_ATTENDANCE_PERCENT}%)` : percentage >= 85 ? 'EXCELLENT (85%+)' : `MEETS MINIMUM (${MIN_SUBJECT_ATTENDANCE_PERCENT}%+)`;

    return [
      rec.subjectCode,
      rec.subjectName,
      `${rec.theoryPresent}/${rec.theoryHeld}`,
      `${rec.labPresent}/${rec.labHeld}`,
      `${present}/${held}`,
      percentage === null ? 'N/A' : `${percentage.toFixed(1)}%`,
      statusText,
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['Code', 'Subject Name', 'Theory', 'Lab', 'Total Attended', 'Overall %', 'Zone Status']],
    body: summaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { left: 14, right: 14 },
  });

  // Table 2: Detailed Attendance Ledger History
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 130;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. Historical Attendance Ledger Logs', 14, finalY);

  const ledgerRows = ledgerEntries.map((entry, idx) => [
    idx + 1,
    entry.date,
    entry.subjectCode,
    entry.subjectName,
    entry.sessionType,
    attendanceExportStatus(entry.status),
    entry.remarks || '-',
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['#', 'Date & Time', 'Subject Code', 'Subject Name', 'Type', 'Status', 'Remarks']],
    body: ledgerRows.length > 0 ? ledgerRows : [['-', '-', '-', 'No class entries logged', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85], // Slate 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val === 'PRESENT') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ABSENT') {
          data.cell.styles.textColor = [244, 63, 94]; // Rose
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'OFF CLASS') {
          data.cell.styles.textColor = [71, 85, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'EVENT / EXAM CLASS') {
          data.cell.styles.textColor = [109, 40, 217];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'HOLIDAY CLASS' || val === 'RESET') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer Note
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `StudentOS • Academic Verification Report • Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  const rollClean = (student.rollNumber || 'student').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Attendance_Ledger_${rollClean}_Sem${semester}.pdf`);
}

// 2. Export as Excel (.xlsx)
export async function exportAttendanceExcel({ student, attendanceRecords, ledgerEntries: allLedgerEntries, semester }: ExportDataParams) {
  const ledgerEntries = classAttendanceEntries(allLedgerEntries);
  const summaryHeaders = [
    'Semester', 'Subject Code', 'Subject Name', 'Theory Held', 'Theory Attended', 'Lab Held',
    'Lab Attended', 'Total Classes Held', 'Total Classes Attended',
    'Attendance Percentage', 'Academic Status', 'Last Logged Date',
  ];
  const summaryData = attendanceRecords.map((rec) => {
    const { held, present, percentage, belowMinimum } = getSubjectAttendance(rec);
    return [
      semester, rec.subjectCode, rec.subjectName, rec.theoryHeld, rec.theoryPresent,
      rec.labHeld, rec.labPresent, held, present, percentage === null ? 'N/A' : `${percentage.toFixed(1)}%`,
      percentage === null ? 'NO CLASSES RECORDED' : belowMinimum ? `BELOW MINIMUM (<${MIN_SUBJECT_ATTENDANCE_PERCENT}%)` : percentage >= 85 ? 'EXCELLENT' : 'MEETS MINIMUM', rec.lastUpdated || 'N/A',
    ];
  });
  const ledgerHeaders = [
    'Entry ID', 'Date & Time', 'Student ID', 'Subject Code', 'Subject Name',
    'Session Type', 'Attendance Status', 'Remarks',
  ];
  const ledgerData = ledgerEntries.map((entry) => [
    entry.id, entry.date, entry.studentId, entry.subjectCode, entry.subjectName,
    entry.sessionType, attendanceExportStatus(entry.status), entry.remarks || '',
  ]);
  const rollClean = (student.rollNumber || 'student').replace(/[^a-zA-Z0-9]/g, '_');
  await writeExcelFile([
    { sheet: 'Subject Summary', data: [summaryHeaders, ...summaryData], stickyRowsCount: 1 },
    { sheet: 'Attendance Ledger History', data: [ledgerHeaders, ...ledgerData], stickyRowsCount: 1 },
  ]).toFile(`Attendance_Ledger_${rollClean}_Sem${semester}.xlsx`);
}

// 3. Export as CSV
export function exportAttendanceCSV({ student, ledgerEntries: allLedgerEntries, semester }: ExportDataParams) {
  const ledgerEntries = classAttendanceEntries(allLedgerEntries);
  const csvCell = (value: unknown) => {
    const text = String(value ?? '');
    const safe = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const headers = ['Semester', 'Entry ID', 'Date', 'Student ID', 'Subject Code', 'Subject Name', 'Session Type', 'Status', 'Remarks'];
  const rows = ledgerEntries.map((entry) => [
    semester, entry.id, entry.date, entry.studentId, entry.subjectCode, entry.subjectName,
    entry.sessionType, attendanceExportStatus(entry.status), entry.remarks || '',
  ].map(csvCell).join(','));
  const blob = new Blob([[headers.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const rollClean = (student.rollNumber || 'student').replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `Attendance_Ledger_${rollClean}_Sem${semester}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
