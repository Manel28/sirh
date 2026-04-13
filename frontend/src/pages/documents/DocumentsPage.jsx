import AppLayout from "../../layouts/AppLayout";

export default function DocumentsPage() {
  return (
    <AppLayout title="Documents">
      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-slate-600">
          Here, the user will be able to browse available HR documents.
        </p>
      </div>
    </AppLayout>
  );
}