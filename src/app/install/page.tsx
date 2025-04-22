"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Home, Download, ChevronDown, ChevronUp, Share, PlusCircle, Copy, Check, HelpCircle, Smartphone, Laptop, WifiOff, Zap, Apple } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BottomNavbar } from '@/components/BottomNavbar';
import { GreenHealthLogo, GreenHealthLogoWithText } from '@/components/LogoImage';

export default function InstallPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect device and browser
  useEffect(() => {
    setIsLoaded(true);
    
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsChrome(/chrome/.test(userAgent) && !/edge|edg/.test(userAgent));
    setIsSafari(/safari/.test(userAgent) && !/chrome|chromium|crios|fxios/.test(userAgent));
  }, []);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    toast({
      title: "URL Copied",
      description: "The app URL has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen bg-background pt-6 pb-20 px-4 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Header */}
      <header className="flex items-center justify-center relative border-b border-border/30 py-4 px-4 mb-6">
        <div className="absolute left-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Download className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-semibold text-green-700">Install App</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        <Card className="border-green-100 shadow-sm mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-green-700">Install GreenHealth</CardTitle>
            <CardDescription>
              Add GreenHealth to your home screen for quick access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center mb-2">
                <GreenHealthLogo width={48} height={48} />
              </div>
              <p className="text-green-800 font-medium">GreenHealth</p>
              <p className="text-green-600 text-sm">Plant Care Systems</p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Install our app on your device for the best experience, including offline access and faster loading times.
            </p>
            
            <Badge variant="outline" className="w-full justify-center py-1 border-green-200 bg-green-50 text-green-700">
              No App Store download required!
            </Badge>
          </CardContent>
        </Card>
        
        <Accordion type="single" collapsible className="w-full mb-6">
          {isIOS && (
            <AccordionItem value="ios">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Install on iOS
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">Follow these steps to install on your iPhone or iPad:</p>
                <ol className="space-y-4 mt-2">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <p className="font-medium">Open in Safari</p>
                      <p className="text-sm text-muted-foreground">This feature only works in Safari browser.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Share className="h-4 w-4" /> at the bottom of the screen
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <p className="font-medium">Tap "Add to Home Screen"</p>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <PlusCircle className="h-4 w-4" /> Scroll down to find this option
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <p className="font-medium">Tap "Add" in the top-right corner</p>
                      <p className="text-sm text-muted-foreground">The app will now appear on your home screen</p>
                    </div>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {isAndroid && (
            <AccordionItem value="android">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Install on Android
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm">Follow these steps to install on your Android device:</p>
                <ol className="space-y-4 mt-2">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <p className="font-medium">Open in Chrome</p>
                      <p className="text-sm text-muted-foreground">This feature works best in Chrome browser.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <p className="font-medium">Tap the menu button (⋮)</p>
                      <p className="text-sm text-muted-foreground">Look for three dots in the top-right corner</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                      <p className="text-sm text-muted-foreground">The option may vary depending on your device</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <p className="font-medium">Tap "Install" when prompted</p>
                      <p className="text-sm text-muted-foreground">The app will now appear on your home screen</p>
                    </div>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          )}
          
          <AccordionItem value="desktop">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                Install on Desktop
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">Follow these steps to install on your desktop:</p>
              <ol className="space-y-4 mt-2">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <p className="font-medium">Open in Chrome, Edge, or other modern browser</p>
                    <p className="text-sm text-muted-foreground">Desktop installation works best with Chromium-based browsers.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <p className="font-medium">Look for the install icon in the address bar</p>
                    <p className="text-sm text-muted-foreground">It appears as a computer or "+" icon</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <p className="font-medium">Click "Install" when prompted</p>
                    <p className="text-sm text-muted-foreground">The app will install and create a desktop shortcut</p>
                  </div>
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="other">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install on Other Devices
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">If you're using a different device or browser:</p>
              <div className="mt-3 space-y-3">
                <p className="text-sm">1. Copy the app URL and open it in a modern browser like Chrome or Safari:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.origin : ''}
                    className="flex-1 py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-md"
                    aria-label="App URL"
                    placeholder="App URL"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1"
                    onClick={copyUrl}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-sm">2. Look for "Add to Home Screen" or "Install" options in your browser's menu.</p>
                <p className="text-sm">3. Follow the prompts to install the application.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <Card className="border-green-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-green-700">Benefits of Installing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <WifiOff className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="font-medium">Offline Access</p>
                <p className="text-sm text-muted-foreground">Use key features even without internet</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Zap className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="font-medium">Faster Loading</p>
                <p className="text-sm text-muted-foreground">Improved performance and responsiveness</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Icons.bell className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Get reminders about plant care</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
} 