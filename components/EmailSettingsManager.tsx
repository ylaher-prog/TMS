import React, { useMemo } from 'react';
import type { GeneralSettings, SenderEmailAccount } from '../types';
import { GoogleIcon, CheckCircleIcon } from './Icons';

interface EmailSettingsManagerProps {
    generalSettings: GeneralSettings;
    setGeneralSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
}

const EmailSettingsManager: React.FC<EmailSettingsManagerProps> = ({ generalSettings, setGeneralSettings }) => {
    
    // Derive state from props to ensure UI is always in sync with app state
    const connectedGoogleAccount = useMemo(
        () => generalSettings.senderEmails.find(acc => acc.type === 'google'),
        [generalSettings.senderEmails]
    );

    const handleConnect = () => {
        // This is a simulation. A real implementation would trigger the Google OAuth popup.
        // For this frontend demo, we simulate a successful connection with a mock email.
        const mockConnectedEmail = "principal@qurtubaonline.co.za";

        setGeneralSettings(prev => {
            const newGoogleAccount: SenderEmailAccount = { 
                id: `google-${Date.now()}`, 
                email: mockConnectedEmail, 
                isDefault: true, 
                type: 'google' 
            };
            
            // Filter out any old Google accounts and ensure all other accounts are not default
            const otherAccounts = prev.senderEmails
                .filter(e => e.type !== 'google')
                .map(e => ({ ...e, isDefault: false }));

            return {
                ...prev,
                senderEmails: [...otherAccounts, newGoogleAccount]
            };
        });
    };

    const handleDisconnect = () => {
        setGeneralSettings(prev => {
            const remaining = prev.senderEmails.filter(e => e.type !== 'google');
            // If the default (Google) account was just removed, make the first remaining one default.
            if (remaining.length > 0 && !remaining.some(e => e.isDefault)) {
                remaining[0].isDefault = true;
            }
            return { ...prev, senderEmails: remaining };
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Email Configuration</h3>
            <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">Connect a Google account to authorize the system to send emails on your behalf (e.g., workload reports). The connected account will be set as the default sender.</p>

            <div className="border-t dark:border-slate-700 pt-4">
                {connectedGoogleAccount ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                        Google Account Connected
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{connectedGoogleAccount.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                className="px-3 py-1.5 text-sm font-semibold text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 dark:bg-slate-700 dark:border-red-600 dark:text-red-300 dark:hover:bg-slate-600"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                     <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex flex-col items-center justify-center text-center py-4">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Connect your Google Account</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-4">By signing in, you allow SMT to open pre-filled Gmail compose windows using this account's address, streamlining your email workflow.</p>
                            <button
                                onClick={handleConnect}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <GoogleIcon className="w-5 h-5"/>
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailSettingsManager;