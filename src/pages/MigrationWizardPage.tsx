import React from 'react';

import { AppPage } from '../components/AppPage';
import { MigrationWizard } from '../migration-wizard/MigrationWizard';

const MigrationWizardPage: React.FC = () => {
  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          to: '/openshift/migration-assessment',
          children: 'Migration assessment',
        },
        { key: 2, children: 'Guide', isActive: true },
      ]}
      title="Welcome, let's start your migration journey from VMware to OpenShift."
    >
      <MigrationWizard />
    </AppPage>
  );
};

MigrationWizardPage.displayName = 'MigrationWizardPage';

export default MigrationWizardPage;
