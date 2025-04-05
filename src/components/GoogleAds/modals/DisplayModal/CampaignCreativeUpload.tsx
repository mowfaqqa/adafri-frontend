"use client";
import React, { useState, useRef, ChangeEvent, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PlusIcon, TrashIcon } from 'lucide-react';

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'text';
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    className = '',
    children,
    ...props
}) => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantClasses = {
        primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
        text: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:ring-indigo-500 px-2"
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

const Input: React.FC<InputProps> = ({
    className = '',
    ...props
}) => {
    return (
        <input
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 ${className}`}
            {...props}
        />
    );
};

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
}

const Textarea: React.FC<TextareaProps> = ({
    className = '',
    ...props
}) => {
    return (
        <textarea
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 ${className}`}
            {...props}
        />
    );
};

// Main Campaign Creative Upload Component
interface CampaignCreativeUploadProps {
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: (creativeData: any) => void;
}

const BANNER_SIZES = [
    { width: 300, height: 250, name: 'Medium Rectangle' },
    { width: 728, height: 90, name: 'Leaderboard' },
    { width: 160, height: 600, name: 'Wide Skyscraper' },
    { width: 300, height: 600, name: 'Half Page' },
    { width: 970, height: 90, name: 'Large Leaderboard' }
];

// const MAX_FILE_SIZE = 150 * 1024; // 150 KB in bytes

// // Helper function to validate image dimensions and file size
// const validateImage = (file: File): Promise<{
//     isValid: boolean,
//     width: number,
//     height: number,
//     fileSize: number,
//     errors: string[]
// }> => {
//     return new Promise((resolve) => {
//         const img = new Image();
//         img.onload = () => {
//             const errors: string[] = [];

//             // Check dimensions
//             const dimensionsValid = ALLOWED_BANNER_SIZES.some(
//                 size => (img.width === size.width && img.height === size.height)
//             );
//             if (!dimensionsValid) {
//                 errors.push(`Invalid image size. Allowed sizes are: ${ALLOWED_BANNER_SIZES.map(s => `${s.width}x${s.height}`).join(', ')}`);
//             }

//             // Check file size
//             const fileSize = file.size;
//             const fileSizeValid = fileSize <= MAX_FILE_SIZE;
//             if (!fileSizeValid) {
//                 errors.push(`File size exceeds 150 KB. Current size: ${(fileSize / 1024).toFixed(2)} KB`);
//             }

//             resolve({
//                 isValid: dimensionsValid && fileSizeValid,
//                 width: img.width,
//                 height: img.height,
//                 fileSize,
//                 errors
//             });
//         };
//         img.src = URL.createObjectURL(file);
//     });
// };

// Constants for file validation
const MAX_FILE_SIZE_WITH_CREATIVES = 150 * 1024; // 150 KB
const MAX_FILE_SIZE_WITHOUT_CREATIVES = 3 * 1024 * 1024; // 3 MB
const MAX_IMAGES = 4;

// Interface for uploaded image
interface UploadedImage {
    file: File;
    preview: string;
    width: number;
    height: number;
    type: 'banner' | 'square' | 'portrait' | 'landscape' | 'logo';
}

const CampaignCreativeUpload: React.FC<CampaignCreativeUploadProps> = ({
    isOpen,
    onClose,
    onPrevious,
    onNext,
}) => {
    const [withCreatives, setWithCreatives] = useState<boolean>(true);
    const [imageErrors, setImageErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [adTitle, setAdTitle] = useState<string>('');
    const [adDescription, setAdDescription] = useState<string>('');
    const [images, setImages] = useState<UploadedImage[]>([]);

    // Determine image type based on dimensions
    const determineImageType = (width: number, height: number): UploadedImage['type'] => {
        // Check if it's a banner size
        const isBannerSize = BANNER_SIZES.some(
            size => size.width === width && size.height === height
        );
        if (isBannerSize) return 'banner';

        if (width === height) return 'square';
        return width > height ? 'landscape' : 'portrait';
    };

    // Validate image for both creative types
    const validateImage = (file: File): Promise<{
        isValid: boolean,
        width: number,
        height: number,
        type: UploadedImage['type'],
        errors: string[]
    }> => {
        return new Promise((resolve) => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                resolve({
                    isValid: false,
                    width: 0,
                    height: 0,
                    type: 'logo',
                    errors: ['Invalid file type. Please upload an image.']
                });
                return;
            }

            const img = new Image();
            img.onload = () => {
                const maxFileSize = withCreatives
                    ? MAX_FILE_SIZE_WITH_CREATIVES
                    : MAX_FILE_SIZE_WITHOUT_CREATIVES;

                const errors: string[] = [];

                // Check file size
                if (file.size > maxFileSize) {
                    errors.push(
                        withCreatives
                            ? `File size exceeds 150 KB. Current size: ${(file.size / 1024).toFixed(2)} KB`
                            : `File size exceeds 3 MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
                    );
                }

                // Validate dimensions for creative mode
                if (withCreatives) {
                    const dimensionsValid = BANNER_SIZES.some(
                        size => size.width === img.width && size.height === img.height
                    );
                    if (!dimensionsValid) {
                        errors.push(
                            `Invalid image size. Allowed banner sizes are: ${BANNER_SIZES.map(s => `${s.width}x${s.height} (${s.name})`).join(', ')
                            }`
                        );
                    }
                }

                const type = determineImageType(img.width, img.height);

                resolve({
                    isValid: errors.length === 0,
                    width: img.width,
                    height: img.height,
                    type,
                    errors
                });
            };

            img.onerror = () => {
                resolve({
                    isValid: false,
                    width: 0,
                    height: 0,
                    type: 'logo',
                    errors: ['Unable to process the image.']
                });
            };

            img.src = URL.createObjectURL(file);
        });
    };


    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check if we've reached max images
            if (images.length >= MAX_IMAGES) {
                setImageErrors(['Maximum of 4 images allowed.']);
                return;
            }

            // Validate image
            const { isValid, width, height, type, errors } = await validateImage(file);

            if (isValid) {
                // Create image object
                const newImage: UploadedImage = {
                    file,
                    preview: URL.createObjectURL(file),
                    width,
                    height,
                    type
                };

                // Add to images array
                setImages(prev => [...prev, newImage]);
                setImageErrors([]);
            } else {
                setImageErrors(errors);
            }
        }
    };

    // Remove an image
    const removeImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // const handleBrowseClick = () => {
    //     if (fileInputRef.current) {
    //         fileInputRef.current.click();
    //     }
    // };

    // Handle submission
    const handleSubmit = () => {
        if (!withCreatives && images.length === 0) {
            setImageErrors(['Please upload at least one image.']);
            return;
        }

        const creativeData = {
            withCreatives,
            images,
            adTitle,
            adDescription
        };

        onNext(creativeData);
    };

    // Trigger file input
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
                <div className="space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Display campaign</DialogTitle>
                        <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
                            <div className="bg-teal-500 h-2 rounded-full w-full"></div>
                        </div>
                    </DialogHeader>

                    <div>
                        <h3 className="text-lg border-gray-200 pb-2">
                            Import your creatives or publish without creatives
                        </h3>


                        {/* Toggle for with/without creatives */}
                        <div className="flex items-center justify-center space-x-4 mb-8">
                            <span
                                className={`cursor-pointer ${withCreatives ? 'font-semibold' : 'text-gray-500'}`}
                                onClick={() => {
                                    setWithCreatives(true);
                                    setImages([]); // Reset images when switching modes
                                }}
                            >
                                With creatives
                            </span>

                            <div className="relative inline-block w-16 h-8">
                                <input
                                    type="checkbox"
                                    className="opacity-0 w-0 h-0"
                                    checked={!withCreatives}
                                    onChange={() => {
                                        setWithCreatives(!withCreatives);
                                        setImages([]); // Reset images when switching modes
                                    }}
                                    id="creative-toggle"
                                />
                                <label
                                    htmlFor="creative-toggle"
                                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full ${!withCreatives ? 'bg-teal-500' : 'bg-gray-300'}`}
                                >
                                    <span
                                        className={`absolute h-6 w-6 left-1 bottom-1 bg-white rounded-full transition-transform duration-300 ${!withCreatives ? 'transform translate-x-8' : ''}`}
                                    ></span>
                                </label>
                            </div>

                            <span
                                className={`cursor-pointer ${!withCreatives ? 'font-semibold' : 'text-gray-500'}`}
                                onClick={() => {
                                    setWithCreatives(false);
                                    setImages([]); // Reset images when switching modes
                                }}
                            >
                                Without creatives
                            </span>
                        </div>

                        {/* Image Upload Section */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />

                            {/* Image Grid */}
                            <div className="grid grid-cols-5 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={image.preview}
                                            alt={`Uploaded ${image.type}`}
                                            className="w-full h-24 object-cover rounded-md"
                                        />
                                        <div className="absolute top-1 right-1 bg-white/70 rounded-full p-1">
                                            <TrashIcon
                                                className="w-4 h-4 text-red-500 cursor-pointer"
                                                onClick={() => removeImage(index)}
                                            />
                                        </div>
                                        <p className="text-xs text-center mt-1 capitalize">
                                            {image.type === 'banner'
                                                ? `${image.width}x${image.height}`
                                                : image.type}
                                        </p>
                                    </div>
                                ))}

                                {/* Add Image Button */}
                                {images.length < MAX_IMAGES && (
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center h-24 cursor-pointer hover:bg-gray-50"
                                        onClick={triggerFileInput}
                                    >
                                        <PlusIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Error Messages */}
                            {imageErrors.length > 0 && (
                                <div className="text-red-500 mt-2 text-sm">
                                    {imageErrors.map((error, index) => (
                                        <p key={index}>{error}</p>
                                    ))}
                                </div>
                            )}

                            {/* Guidance Text */}
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                {withCreatives
                                    ? 'Upload banner images with specific dimensions. Max file size: 150 KB.'
                                    : 'Upload up to 4 images (mix of square, portrait, landscape). Max file size: 3 MB per image.'}
                            </p>
                        </div>

                        {/* Ad Title and Description */}
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Ad Title</label>
                                <Input
                                    value={adTitle}
                                    onChange={(e) => setAdTitle(e.target.value)}
                                    placeholder="Enter a compelling headline for your ad"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium">Ad Description</label>
                                <Textarea
                                    value={adDescription}
                                    onChange={(e) => setAdDescription(e.target.value)}
                                    placeholder="Describe your product or service (max 150 characters)"
                                    className="w-full"
                                    maxLength={150}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={onPrevious}>
                            Previous
                        </Button>
                        <Button onClick={handleSubmit}>
                            Campaign recap
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CampaignCreativeUpload;

































// "use client";
// import React, { useState, useRef, ChangeEvent, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { PlusIcon, TrashIcon } from 'lucide-react';

// // Button Component
// interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//     variant?: 'primary' | 'secondary' | 'outline' | 'text';
//     className?: string;
// }

// const Button: React.FC<ButtonProps> = ({
//     variant = 'primary',
//     className = '',
//     children,
//     ...props
// }) => {
//     const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

//     const variantClasses = {
//         primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500",
//         secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
//         outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
//         text: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:ring-indigo-500 px-2"
//     };

//     return (
//         <button
//             className={`${baseClasses} ${variantClasses[variant]} ${className}`}
//             {...props}
//         >
//             {children}
//         </button>
//     );
// };

// // Input Component
// interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
//     className?: string;
// }

// const Input: React.FC<InputProps> = ({
//     className = '',
//     ...props
// }) => {
//     return (
//         <input
//             className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 ${className}`}
//             {...props}
//         />
//     );
// };

// // Textarea Component
// interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
//     className?: string;
// }

// const Textarea: React.FC<TextareaProps> = ({
//     className = '',
//     ...props
// }) => {
//     return (
//         <textarea
//             className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 ${className}`}
//             {...props}
//         />
//     );
// };

// // Main Campaign Creative Upload Component
// interface CampaignCreativeUploadProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onPrevious: () => void;
//     onNext: (creativeData: any) => void;
// }

// // Allowed Google banner sizes
// const ALLOWED_BANNER_SIZES = [
//     { width: 300, height: 250 },   // Medium banner
//     { width: 728, height: 90 },    // Leaderboard
//     { width: 160, height: 600 },   // Wide Skyscraper
//     { width: 300, height: 600 },   // Halfpage
//     { width: 970, height: 90 },    // Large Leaderboard
// ];

// // const MAX_FILE_SIZE = 150 * 1024; // 150 KB in bytes

// // Helper function to validate image dimensions and file size
// const validateImage = (file: File): Promise<{
//     isValid: boolean,
//     width: number,
//     height: number,
//     fileSize: number,
//     errors: string[]
// }> => {
//     return new Promise((resolve) => {
//         const img = new Image();
//         img.onload = () => {
//             const errors: string[] = [];

//             // Check dimensions
//             const dimensionsValid = ALLOWED_BANNER_SIZES.some(
//                 size => (img.width === size.width && img.height === size.height)
//             );
//             if (!dimensionsValid) {
//                 errors.push(`Invalid image size. Allowed sizes are: ${ALLOWED_BANNER_SIZES.map(s => `${s.width}x${s.height}`).join(', ')}`);
//             }

//             // Check file size
//             const fileSize = file.size;
//             const fileSizeValid = fileSize <= MAX_FILE_SIZE;
//             if (!fileSizeValid) {
//                 errors.push(`File size exceeds 150 KB. Current size: ${(fileSize / 1024).toFixed(2)} KB`);
//             }

//             resolve({
//                 isValid: dimensionsValid && fileSizeValid,
//                 width: img.width,
//                 height: img.height,
//                 fileSize,
//                 errors
//             });
//         };
//         img.src = URL.createObjectURL(file);
//     });
// };

// // For Without Creative
// // / Constants for file validation
// const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB in bytes
// const MAX_IMAGES = 4;

// // Interface for uploaded image
// interface UploadedImage {
//     file: File;
//     preview: string;
//     type: 'square' | 'portrait' | 'landscape' | 'logo';
// }

// // Function to determine image type
// const determineImageType = (width: number, height: number): 'square' | 'portrait' | 'landscape' => {
//     if (width === height) return 'square';
//     return width > height ? 'landscape' : 'portrait';
// };

// const CampaignCreativeUpload: React.FC<CampaignCreativeUploadProps> = ({
//     isOpen,
//     onClose,
//     onPrevious,
//     onNext,
// }) => {
//     const [withCreatives, setWithCreatives] = useState<boolean>(true);
//     const [imageFile, setImageFile] = useState<File | null>(null);
//     const [imageErrors, setImageErrors] = useState<string[]>([]);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const [adTitle, setAdTitle] = useState<string>('');
//     const [adDescription, setAdDescription] = useState<string>('');
//     const [images, setImages] = useState<UploadedImage[]>([]);

//     // Validate uploaded image
//     const validateImage = (file: File): Promise<{
//         isValid: boolean,
//         width: number,
//         height: number,
//         type?: 'square' | 'portrait' | 'landscape' | 'logo',
//         errors: string[]
//     }> => {
//         return new Promise((resolve) => {
//             // Check file type
//             if (!file.type.startsWith('image/')) {
//                 resolve({
//                     isValid: false,
//                     width: 0,
//                     height: 0,
//                     errors: ['Invalid file type. Please upload an image.']
//                 });
//                 return;
//             }

//             // Check file size
//             if (file.size > MAX_FILE_SIZE) {
//                 resolve({
//                     isValid: false,
//                     width: 0,
//                     height: 0,
//                     errors: [`File size exceeds 3 MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`]
//                 });
//                 return;
//             }

//             const img = new Image();
//             img.onload = () => {
//                 const type = determineImageType(img.width, img.height);
//                 resolve({
//                     isValid: true,
//                     width: img.width,
//                     height: img.height,
//                     type,
//                     errors: []
//                 });
//             };
//             img.onerror = () => {
//                 resolve({
//                     isValid: false,
//                     width: 0,
//                     height: 0,
//                     errors: ['Unable to process the image.']
//                 });
//             };
//             img.src = URL.createObjectURL(file);
//         });
//     };

//     const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//             const file = e.target.files[0];
//             // setImageFile(e.target.files[0]);

//             // First, check file type
//             // Validate image
//             const { isValid, width, height, type, errors } = await validateImage(file);

//             if (isValid) {
//                 // Check if we've reached max images
//                 if (images.length >= MAX_IMAGES) {
//                     setImageErrors(['Maximum of 4 images allowed.']);
//                     return;
//                 }

//                 // Create image object
//                 const newImage: UploadedImage = {
//                     file,
//                     preview: URL.createObjectURL(file),
//                     type: type || 'square'
//                 };

//                 // Add to images array
//                 setImages(prev => [...prev, newImage]);
//                 setImageErrors([]);
//             } else {
//                 setImageErrors(errors);
//             }
//         }
//     };

//     // Remove an image
//     const removeImage = (indexToRemove: number) => {
//         setImages(prev => prev.filter((_, index) => index !== indexToRemove));
//     };


//     const handleBrowseClick = () => {
//         if (fileInputRef.current) {
//             fileInputRef.current.click();
//         }
//     };

//     // Handle submission
//     const handleSubmit = () => {
//         if (!withCreatives && images.length === 0) {
//             setImageErrors(['Please upload at least one image.']);
//             return;
//         }

//         const creativeData = {
//             withCreatives,
//             images,
//             adTitle,
//             adDescription
//         };

//         onNext(creativeData);
//     };

//     // Trigger file input
//     const triggerFileInput = () => {
//         if (fileInputRef.current) {
//             fileInputRef.current.click();
//         }
//     };


//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
//                 <div className="space-y-6">
//                     <DialogHeader>
//                         <DialogTitle className="text-xl">Display campaign</DialogTitle>
//                         <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
//                             <div className="bg-teal-500 h-2 rounded-full w-full"></div>
//                         </div>
//                     </DialogHeader>

//                     <div>
//                         <h3 className="text-lg border-gray-200 pb-2">
//                             Import your creatives or publish without creatives
//                         </h3>

//                         {/* Toggle for with/without creatives */}
//                         <div className="flex items-center justify-center space-x-4 mb-8">
//                             <span
//                                 className={`cursor-pointer ${withCreatives ? 'font-semibold' : 'text-gray-500'}`}
//                                 onClick={() => setWithCreatives(true)}
//                             >
//                                 With creatives
//                             </span>

//                             <div className="relative inline-block w-16 h-8">
//                                 <input
//                                     type="checkbox"
//                                     className="opacity-0 w-0 h-0"
//                                     checked={!withCreatives}
//                                     onChange={() => setWithCreatives(!withCreatives)}
//                                     id="creative-toggle"
//                                 />
//                                 <label
//                                     htmlFor="creative-toggle"
//                                     className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full ${!withCreatives ? 'bg-teal-500' : 'bg-gray-300'}`}
//                                 >
//                                     <span
//                                         className={`absolute h-6 w-6 left-1 bottom-1 bg-white rounded-full transition-transform duration-300 ${!withCreatives ? 'transform translate-x-8' : ''}`}
//                                     ></span>
//                                 </label>
//                             </div>

//                             <span
//                                 className={`cursor-pointer ${!withCreatives ? 'font-semibold' : 'text-gray-500'}`}
//                                 onClick={() => setWithCreatives(false)}
//                             >
//                                 Without creatives
//                             </span>
//                         </div>

//                         {!withCreatives && (
//                             <div className="space-y-4">
//                                 {/* Image Upload Section */}
//                                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
//                                     <input
//                                         type="file"
//                                         ref={fileInputRef}
//                                         className="hidden"
//                                         accept="image/*"
//                                         onChange={handleFileSelect}
//                                     />

//                                     {/* Image Grid */}
//                                     <div className="grid grid-cols-5 gap-4">
//                                         {images.map((image, index) => (
//                                             <div key={index} className="relative">
//                                                 <img
//                                                     src={image.preview}
//                                                     alt={`Uploaded ${image.type}`}
//                                                     className="w-full h-24 object-cover rounded-md"
//                                                 />
//                                                 <div className="absolute top-1 right-1 bg-white/70 rounded-full p-1">
//                                                     <TrashIcon
//                                                         className="w-4 h-4 text-red-500 cursor-pointer"
//                                                         onClick={() => removeImage(index)}
//                                                     />
//                                                 </div>
//                                                 <p className="text-xs text-center mt-1 capitalize">{image.type}</p>
//                                             </div>
//                                         ))}

//                                         {/* Add Image Button */}
//                                         {images.length < MAX_IMAGES && (
//                                             <div
//                                                 className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center h-24 cursor-pointer hover:bg-gray-50"
//                                                 onClick={triggerFileInput}
//                                             >
//                                                 <PlusIcon className="w-8 h-8 text-gray-400" />
//                                             </div>
//                                         )}
//                                     </div>

//                                     {/* Error Messages */}
//                                     {imageErrors.length > 0 && (
//                                         <div className="text-red-500 mt-2 text-sm">
//                                             {imageErrors.map((error, index) => (
//                                                 <p key={index}>{error}</p>
//                                             ))}
//                                         </div>
//                                     )}

//                                     {/* Guidance Text */}
//                                     <p className="text-xs text-gray-500 mt-4 text-center">
//                                         Upload up to 4 images (mix of square, portrait, landscape)
//                                         Max file size: 3 MB per image
//                                     </p>
//                                 </div>

//                                 {/* Ad Title and Description */}
//                                 <div>
//                                     <label className="block mb-2 text-sm font-medium">Ad Title</label>
//                                     <Input
//                                         value={adTitle}
//                                         onChange={(e) => setAdTitle(e.target.value)}
//                                         placeholder="Enter a compelling headline for your ad"
//                                         className="w-full"
//                                     />
//                                 </div>

//                                 <div>
//                                     <label className="block mb-2 text-sm font-medium">Ad Description</label>
//                                     <Textarea
//                                         value={adDescription}
//                                         onChange={(e) => setAdDescription(e.target.value)}
//                                         placeholder="Describe your product or service (max 150 characters)"
//                                         className="w-full"
//                                         maxLength={150}
//                                         rows={3}
//                                     />
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     <div className="flex justify-between pt-4">
//                         <Button variant="outline" onClick={onPrevious}>
//                             Previous
//                         </Button>
//                         <Button onClick={handleSubmit}>
//                             Campaign recap
//                         </Button>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default CampaignCreativeUpload;

































// "use client";
// import React, { useState, useRef, ChangeEvent, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// // Button Component
// interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//     variant?: 'primary' | 'secondary' | 'outline' | 'text';
//     className?: string;
// }

// const Button: React.FC<ButtonProps> = ({
//     variant = 'primary',
//     className = '',
//     children,
//     ...props
// }) => {
//     const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

//     const variantClasses = {
//         primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500",
//         secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
//         outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
//         text: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:ring-indigo-500 px-2"
//     };

//     return (
//         <button
//             className={`${baseClasses} ${variantClasses[variant]} ${className}`}
//             {...props}
//         >
//             {children}
//         </button>
//     );
// };

// // Input Component
// interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
//     className?: string;
// }

// const Input: React.FC<InputProps> = ({
//     className = '',
//     ...props
// }) => {
//     return (
//         <input
//             className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 ${className}`}
//             {...props}
//         />
//     );
// };

// // Textarea Component
// interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
//     className?: string;
// }

// const Textarea: React.FC<TextareaProps> = ({
//     className = '',
//     ...props
// }) => {
//     return (
//         <textarea
//             className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 ${className}`}
//             {...props}
//         />
//     );
// };

// // Main Campaign Creative Upload Component
// interface CampaignCreativeUploadProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onPrevious: () => void;
//     onNext: (creativeData: any) => void;
// }

// const CampaignCreativeUpload: React.FC<CampaignCreativeUploadProps> = ({
//     isOpen,
//     onClose,
//     onPrevious,
//     onNext,
// }) => {
//     const [withCreatives, setWithCreatives] = useState<boolean>(true);
//     const [imageFile, setImageFile] = useState<File | null>(null);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const [adTitle, setAdTitle] = useState<string>('');
//     const [adDescription, setAdDescription] = useState<string>('');

//     const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//             setImageFile(e.target.files[0]);
//         }
//     };

//     const handleBrowseClick = () => {
//         if (fileInputRef.current) {
//             fileInputRef.current.click();
//         }
//     };

//     const handleSubmit = () => {
//         const creativeData = {
//             withCreatives,
//             imageFile,
//             adTitle,
//             adDescription
//         };

//         onNext(creativeData);
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
//                 <div className="space-y-6">
//                     <DialogHeader>
//                         <DialogTitle className="text-xl">Display campaign</DialogTitle>
//                         <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
//                             <div className="bg-teal-500 h-2 rounded-full w-full"></div>
//                         </div>
//                     </DialogHeader>

//                     <div>
//                         <h3 className="text-lg border-gray-200 pb-2">
//                             Import your creatives or publish without creatives
//                         </h3>

//                         {/* Toggle for with/without creatives */}
//                         <div className="flex items-center justify-center space-x-4 mb-8">
//                             <span
//                                 className={`cursor-pointer ${withCreatives ? 'font-semibold' : 'text-gray-500'}`}
//                                 onClick={() => setWithCreatives(true)}
//                             >
//                                 With creatives
//                             </span>

//                             <div className="relative inline-block w-16 h-8">
//                                 <input
//                                     type="checkbox"
//                                     className="opacity-0 w-0 h-0"
//                                     checked={!withCreatives}
//                                     onChange={() => setWithCreatives(!withCreatives)}
//                                     id="creative-toggle"
//                                 />
//                                 <label
//                                     htmlFor="creative-toggle"
//                                     className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full ${!withCreatives ? 'bg-teal-500' : 'bg-gray-300'}`}
//                                 >
//                                     <span
//                                         className={`absolute h-6 w-6 left-1 bottom-1 bg-white rounded-full transition-transform duration-300 ${!withCreatives ? 'transform translate-x-8' : ''}`}
//                                     ></span>
//                                 </label>
//                             </div>

//                             <span
//                                 className={`cursor-pointer ${!withCreatives ? 'font-semibold' : 'text-gray-500'}`}
//                                 onClick={() => setWithCreatives(false)}
//                             >
//                                 Without creatives
//                             </span>
//                         </div>

//                         {withCreatives ? (
//                             <div className="space-y-4">
//                                 <div>
//                                     <label className="block mb-2 text-sm font-medium">Images sizes</label>
//                                     <div className="border border-gray-300 rounded-md p-6 text-center">
//                                         <input
//                                             type="file"
//                                             ref={fileInputRef}
//                                             className="hidden"
//                                             accept="image/*"
//                                             onChange={handleFileSelect}
//                                         />
//                                         {!imageFile ? (
//                                             <>
//                                                 <p className="text-gray-600 mb-2">Drag and drop to import your images</p>
//                                                 <p className="text-gray-600 mb-4">or</p>
//                                                 <Button
//                                                     variant="secondary"
//                                                     onClick={handleBrowseClick}
//                                                 >
//                                                     Select from your computer
//                                                 </Button>
//                                             </>
//                                         ) : (
//                                             <div className="flex flex-col items-center">
//                                                 <img
//                                                     src={URL.createObjectURL(imageFile)}
//                                                     alt="Selected image"
//                                                     className="max-h-40 max-w-full mb-2 rounded"
//                                                 />
//                                                 <p className="text-sm text-gray-600">{imageFile.name}</p>
//                                                 <Button
//                                                     variant="text"
//                                                     onClick={() => setImageFile(null)}
//                                                     className="mt-2"
//                                                 >
//                                                     Remove
//                                                 </Button>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>
//                         ) : (
//                             <div className="space-y-4">
//                                 <div className="p-4 bg-gray-100 rounded-md">
//                                     <p className="text-gray-700 mb-4">
//                                         Your ads will be created without custom images. Google will generate relevant visuals based on your website content and campaign settings.
//                                     </p>
//                                     <Button
//                                         variant="secondary"
//                                         onClick={handleBrowseClick}
//                                         className="mx-auto block"
//                                     >
//                                         Upload file
//                                     </Button>
//                                     <input
//                                         type="file"
//                                         ref={fileInputRef}
//                                         className="hidden"
//                                         accept="image/*"
//                                         onChange={handleFileSelect}
//                                     />
//                                 </div>
//                                 {/* Title and description fields */}
//                                 <div>
//                                     <label className="block mb-2 text-sm font-medium">Ad Title</label>
//                                     <Input
//                                         value={adTitle}
//                                         onChange={(e) => setAdTitle(e.target.value)}
//                                         placeholder="Enter a compelling headline for your ad"
//                                         className="w-full"
//                                     />
//                                 </div>

//                                 <div>
//                                     <label className="block mb-2 text-sm font-medium">Ad Description</label>
//                                     <Textarea
//                                         value={adDescription}
//                                         onChange={(e) => setAdDescription(e.target.value)}
//                                         placeholder="Describe your product or service (max 150 characters)"
//                                         className="w-full"
//                                         maxLength={150}
//                                         rows={3}
//                                     />
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     <div className="flex justify-between pt-4">
//                         <Button variant="outline" onClick={onPrevious}>
//                             Previous
//                         </Button>
//                         <Button onClick={handleSubmit}>
//                             Campaign recap
//                         </Button>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default CampaignCreativeUpload;