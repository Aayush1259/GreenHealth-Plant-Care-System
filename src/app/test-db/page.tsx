'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface TestResult {
  status: 'success' | 'error';
  result?: any;
  error?: string;
}

interface DatabaseTests {
  userCount: TestResult;
  plantCount: TestResult;
  postCount: TestResult;
  sampleUser: TestResult;
  [key: string]: TestResult;
}

interface ApiResponse {
  status: 'success' | 'partial_success' | 'error';
  timestamp: string;
  databaseTests: DatabaseTests;
  message?: string;
  error?: string;
}

export default function TestDatabasePage() {
  const [testResults, setTestResults] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test');
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTestResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'partial_success') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            Database Connectivity Test
            {testResults && getStatusIcon(testResults.status)}
          </CardTitle>
          <CardDescription>
            Test the connectivity between the frontend, backend API, and PostgreSQL database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              {testResults && (
                <div className="text-sm text-muted-foreground">
                  Last tested: {new Date(testResults.timestamp).toLocaleString()}
                </div>
              )}
            </div>
            <Button
              onClick={runTests}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run Tests Again
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResults?.message && (
            <Alert variant={testResults.status === 'error' ? 'destructive' : 'default'}>
              <AlertTitle>{testResults.status === 'error' ? 'Error' : 'Info'}</AlertTitle>
              <AlertDescription>{testResults.message}</AlertDescription>
            </Alert>
          )}

          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Database Tests</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(testResults.databaseTests).map(([key, test]) => (
                  <Card key={key}>
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-md font-medium capitalize flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {test.status === 'success' ? (
                        <div>
                          {key === 'sampleUser' ? (
                            <pre className="text-xs p-2 bg-muted rounded overflow-x-auto">
                              {JSON.stringify(test.result, null, 2)}
                            </pre>
                          ) : (
                            <div className="text-2xl font-bold">{test.result}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-red-500">{test.error}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Test Summary</h3>
            {testResults ? (
              <div className="text-sm">
                {testResults.status === 'success' && (
                  <p className="text-green-600">
                    ✓ All database connections are working properly.
                  </p>
                )}
                {testResults.status === 'partial_success' && (
                  <p className="text-amber-600">
                    ⚠ Some database tests failed. Check individual test results above.
                  </p>
                )}
                {testResults.status === 'error' && (
                  <p className="text-red-600">
                    ✗ Database connection test failed. See error message above.
                  </p>
                )}
              </div>
            ) : loading ? (
              <p className="text-sm text-muted-foreground">Running tests...</p>
            ) : (
              <p className="text-sm text-red-600">No test results available. Try running the tests again.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}