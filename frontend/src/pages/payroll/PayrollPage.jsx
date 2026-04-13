import AppLayout from "../../layouts/AppLayout";

export default function PayrollPage() {
  return (
    <AppLayout title="Payroll">
      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-slate-600">
          Here, the user will be able to view and download payslips.
        </p>
      </div>
    </AppLayout>
  );
}