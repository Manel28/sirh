import AppLayout from "../../layouts/AppLayout";

export default function EmployeesPage() {
  return (
    <AppLayout title="Employees">
      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-slate-600">
          This page will allow HR to manage employees and user accounts.
        </p>
      </div>
    </AppLayout>
  );
}