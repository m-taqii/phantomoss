import React from 'react';

const ProposalsPage = () => {
  return (
    <div className="flex flex-col gap-6 text-foreground h-full">
        <div className="flex justify-between items-center bg-card border border-border rounded-xl p-6">
            <div>
                <h2 className="text-xl font-semibold mb-1">Proposals</h2>
                <p className="text-sm text-muted-foreground">Generated documents and pitches.</p>
            </div>
        </div>

        <div className="bg-card border border-border rounded-xl flex-1 flex items-center justify-center p-6 min-h-[500px]">
            <p className="text-muted-foreground text-lg">No proposals generated yet.</p>
        </div>
    </div>
  );
};

export default ProposalsPage;
