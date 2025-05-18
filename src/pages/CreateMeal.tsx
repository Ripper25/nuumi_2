import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Plus, X, Camera, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { v4 as uuidv4 } from 'uuid';

const CreateMeal = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [prepTime, setPrepTime] = useState(15);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load user data');
          navigate('/auth');
          return;
        }

        setCurrentUser({
          id: session.user.id,
          ...userData
        });
      } else {
        toast.error('Please sign in to create a meal');
        navigate('/auth');
      }
      setIsLoading(false);
    };

    fetchCurrentUser();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `meal-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('Please sign in to create a meal');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a meal name');
      return;
    }

    // Filter out empty ingredients and instructions
    const filteredIngredients = ingredients.filter(item => item.trim() !== '');
    const filteredInstructions = instructions.filter(item => item.trim() !== '');

    if (filteredIngredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    if (filteredInstructions.length === 0) {
      toast.error('Please add at least one instruction');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if provided
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage() || '';
      }

      // Create meal
      const { data, error } = await supabase
        .from('meals')
        .insert({
          name,
          description,
          image_url: finalImageUrl,
          emoji,
          calories,
          protein,
          carbs,
          fat,
          prep_time: prepTime,
          tags,
          ingredients: filteredIngredients,
          instructions: filteredInstructions,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Meal created successfully');
      navigate('/meal-planning');
    } catch (error) {
      toast.error('Failed to create meal');
      console.error('Error creating meal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title="Create Baby & Mother Meal"
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />

      <div className="max-w-md mx-auto px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emoji Selection */}
          <div className="space-y-2">
            <Label htmlFor="emoji">Meal Emoji</Label>
            <div className="flex items-center justify-center">
              <div
                className="relative h-48 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30"
              >
                <div className="text-8xl mb-4">{emoji}</div>
                <div className="grid grid-cols-5 gap-2">
                  {['🍼', '🥣', '🍲', '🥗', '🍌', '🥑', '🥕', '🍠', '🥦', '🍞'].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`text-2xl p-2 rounded-full ${emoji === e ? 'bg-nuumi-pink/30' : 'hover:bg-nuumi-pink/10'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Meal Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter meal name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your meal"
              rows={3}
            />
          </div>

          {/* Prep Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="prep-time">Preparation Time</Label>
              <span className="text-sm text-muted-foreground">{prepTime} min</span>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Slider
                id="prep-time"
                value={[prepTime]}
                min={5}
                max={120}
                step={5}
                onValueChange={(value) => setPrepTime(value[0])}
              />
            </div>
          </div>

          {/* Nutrition Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Nutrition Information</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="calories">Calories</Label>
                <span className="text-sm text-muted-foreground">{calories} kcal</span>
              </div>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                placeholder="Calories (kcal)"
                min={0}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">Protein</Label>
                <div className="flex items-center">
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                  <span className="ml-1 text-sm text-muted-foreground">g</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs</Label>
                <div className="flex items-center">
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                  <span className="ml-1 text-sm text-muted-foreground">g</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fat">Fat</Label>
                <div className="flex items-center">
                  <Input
                    id="fat"
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                  <span className="ml-1 text-sm text-muted-foreground">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags (e.g., baby food, 6+ months, mother, lactation)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Ingredients</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
                    disabled={ingredients.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Instructions</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddInstruction}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <Textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInstruction(index)}
                    disabled={instructions.length === 1}
                    className="mt-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Meal'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateMeal;
