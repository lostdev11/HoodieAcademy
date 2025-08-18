import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Upload, Award, Users, ExternalLink, Github } from 'lucide-react';

export default function TraitBountyPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto bg-gradient-to-b from-[#fef2f2] via-[#fff] to-[#f0f9ff] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-pink-600 drop-shadow-sm">⚒️ Trait Bounty Portal</h1>
        <p className="text-lg text-gray-700 mb-6">
          Submit your trait designs for the Hoodie Academy wardrobe. Top designs will be added to the official collection.
        </p>
      </div>

      {/* Current Bounties */}
      <Card className="mb-8 bg-white border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-600 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Active Bounties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
              <h3 className="font-semibold text-orange-800 mb-2">🎨 Hoodie Accessories</h3>
              <p className="text-sm text-gray-600 mb-3">
                Design unique hoodie accessories that reflect Hoodie Academy culture.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">Reward: 500 HOODIE</Badge>
                <Badge variant="outline" className="text-xs">Deadline: Dec 31, 2024</Badge>
              </div>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                Submit Design
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="font-semibold text-purple-800 mb-2">🌟 Legendary Traits</h3>
              <p className="text-sm text-gray-600 mb-3">
                Create ultra-rare traits that will become part of Hoodie Academy lore.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">Reward: 1000 HOODIE</Badge>
                <Badge variant="outline" className="text-xs">Deadline: Jan 15, 2025</Badge>
              </div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                Submit Design
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Guidelines */}
      <Card className="mb-8 bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-600 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Submission Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Technical Requirements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PNG format with transparent background</li>
                <li>• 512x512 pixels minimum resolution</li>
                <li>• File size under 2MB</li>
                <li>• Consistent with Hoodie Academy style</li>
                <li>• Must work with existing trait layers</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Design Standards</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pixel art style preferred</li>
                <li>• High contrast for visibility</li>
                <li>• Scalable design elements</li>
                <li>• Community appeal and lore integration</li>
                <li>• Original work only</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Submission Process</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Submit via GitHub Issues or Notion</li>
                <li>• Include design rationale and lore connection</li>
                <li>• Community voting determines winners</li>
                <li>• Winners receive HOODIE tokens and recognition</li>
                <li>• Selected traits become part of official collection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Submit Form */}
      <Card className="mb-8 bg-white border-green-200">
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Quick Submit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trait Name
              </label>
              <Input 
                placeholder="e.g., Cyberpunk Hoodie" 
                className="border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="backgrounds">Backgrounds</SelectItem>
                  <SelectItem value="effects">Special Effects</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design Description
              </label>
              <Textarea 
                placeholder="Describe your trait design, inspiration, and how it fits into Hoodie Academy lore..."
                className="border-gray-300"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Design
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop your PNG file here, or click to browse
                </p>
                <input type="file" className="hidden" accept=".png" />
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Submit Trait Design
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* External Links */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            External Submission Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="border-gray-300">
              <Link href="https://github.com/hoodieacademy/trait-bounties" target="_blank">
                <Github className="w-4 h-4 mr-2" />
                GitHub Issues
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300">
              <Link href="https://hoodieacademy.notion.site/trait-bounties" target="_blank">
                <Users className="w-4 h-4 mr-2" />
                Notion Database
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 