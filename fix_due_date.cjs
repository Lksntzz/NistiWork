const fs = require('fs');

// 1. Update models/company.rs
const compRsPath = 'src-tauri/src/models/company.rs';
let compRs = fs.readFileSync(compRsPath, 'utf8');
if (!compRs.includes('due_date: Option<String>')) {
  compRs = compRs.replace(
    'pub notes: Option<String>,',
    'pub notes: Option<String>,\n    pub due_date: Option<String>,'
  );
  fs.writeFileSync(compRsPath, compRs);
}

// 2. Update company_repository.rs to SELECT due_date via JOIN
const repoRsPath = 'src-tauri/src/repositories/company_repository.rs';
let repoRs = fs.readFileSync(repoRsPath, 'utf8');

// For get_by_id
repoRs = repoRs.replace(
  'SELECT id, name, description, entry_date, priority, status, local_folder_path, drive_folder_id, notes, created_at, updated_at FROM companies WHERE id = ?1',
  'SELECT c.id, c.name, c.description, c.entry_date, c.priority, c.status, c.local_folder_path, c.drive_folder_id, c.notes, c.created_at, c.updated_at, t.due_date FROM companies c LEFT JOIN tasks t ON t.company_id = c.id WHERE c.id = ?1'
);
if (repoRs.includes('updated_at: row.get(10)?,')) {
    repoRs = repoRs.replace(
      'updated_at: row.get(10)?,',
      'updated_at: row.get(10)?,\n            due_date: row.get(11)?,'
    );
}

// For list
repoRs = repoRs.replace(
  'SELECT id, name, description, entry_date, priority, status, local_folder_path, drive_folder_id, notes, created_at, updated_at FROM companies ORDER BY created_at DESC',
  'SELECT c.id, c.name, c.description, c.entry_date, c.priority, c.status, c.local_folder_path, c.drive_folder_id, c.notes, c.created_at, c.updated_at, t.due_date FROM companies c LEFT JOIN tasks t ON t.company_id = c.id ORDER BY c.created_at DESC'
);

fs.writeFileSync(repoRsPath, repoRs);

// 3. Update task_repository.rs to add update_due_date_by_company
const taskRepoPath = 'src-tauri/src/repositories/task_repository.rs';
let taskRepo = fs.readFileSync(taskRepoPath, 'utf8');
if (!taskRepo.includes('update_due_date_by_company')) {
  taskRepo += `
pub fn update_due_date_by_company(conn: &Connection, company_id: &str, due_date: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE tasks SET due_date = ?1 WHERE company_id = ?2",
        params![due_date, company_id],
    )?;
    Ok(())
}
`;
  fs.writeFileSync(taskRepoPath, taskRepo);
}

// 4. Update company_service.rs
const compSvcPath = 'src-tauri/src/services/company_service.rs';
let compSvc = fs.readFileSync(compSvcPath, 'utf8');
// In create_company, pass company.due_date to Task
compSvc = compSvc.replace(
  'due_date: None,',
  'due_date: company.due_date.clone(),'
);
// In update_company, also update the task's due date
if (!compSvc.includes('update_due_date_by_company')) {
    compSvc = compSvc.replace(
        'company_repository::update(&tx, &company)?;',
        'company_repository::update(&tx, &company)?;\n    task_repository::update_due_date_by_company(&tx, &company.id, company.due_date.as_deref())?;'
    );
}
fs.writeFileSync(compSvcPath, compSvc);

// 5. Update CompanyFormModal.tsx
const formPath = 'src/components/CompanyFormModal.tsx';
let form = fs.readFileSync(formPath, 'utf8');
if (!form.includes('due_date:')) {
  form = form.replace(
    'priority: z.enum([\'BAIXA\', \'NORMAL\', \'ALTA\', \'URGENTE\'] as const),',
    'priority: z.enum([\'BAIXA\', \'NORMAL\', \'ALTA\', \'URGENTE\'] as const),\n  due_date: z.string().optional().nullable().transform(v => v === "" ? null : v),'
  );
  form = form.replace(
    'priority: \'NORMAL\',',
    'priority: \'NORMAL\',\n      due_date: \'\','
  );
  const inputToInsert = `
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Prazo (opcional)</label>
            <input
              type="date"
              {...register('due_date')}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
`;
  form = form.replace('<div>\n            <label className="block text-sm font-medium text-neutral-300 mb-1">Pasta local', inputToInsert + '\n          <div>\n            <label className="block text-sm font-medium text-neutral-300 mb-1">Pasta local');
  fs.writeFileSync(formPath, form);
}

// 6. Update CompanyDetail.tsx
const detailPath = 'src/pages/CompanyDetail.tsx';
let detail = fs.readFileSync(detailPath, 'utf8');
if (!detail.includes('company.due_date')) {
  detail = detail.replace(
    '<p className="text-xs text-neutral-500 mb-1">Entrada</p>',
    '<p className="text-xs text-neutral-500 mb-1">Entrada</p>'
  ); // anchor
  const newHtml = `
              <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Prazo</p>
                <p className="text-sm text-white font-medium">
                  {company.due_date ? format(parseISO(company.due_date), "dd/MM/yyyy") : '---'}
                </p>
              </div>
`;
  detail = detail.replace(
    '<div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-800 col-span-2">',
    newHtml + '<div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-800 col-span-2 md:col-span-1">'
  );
  fs.writeFileSync(detailPath, detail);
}

// 7. Update types/index.ts
const typesPath = 'src/types/index.ts';
let types = fs.readFileSync(typesPath, 'utf8');
if (!types.includes('due_date?: string')) {
  types = types.replace(
    'notes: string | null;',
    'notes: string | null;\n  due_date?: string | null;'
  );
  fs.writeFileSync(typesPath, types);
}

console.log("Fixes applied successfully.");
