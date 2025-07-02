#!/usr/bin/env python3
"""
Create comprehensive ad taxonomy database
Expected output: 1000+ categories from IAB + Google + Facebook
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.taxonomy import TaxonomyManager


async def main():
    """Generate complete advertising taxonomy"""
    print("🚀 Starting ContextMind Taxonomy Generation")
    print("=" * 50)
    
    # Initialize taxonomy manager
    taxonomy_manager = TaxonomyManager()
    
    try:
        # Load all taxonomies
        categories = await taxonomy_manager.load_all_taxonomies()
        
        # Save to JSON file
        output_file = await taxonomy_manager.save_taxonomy(categories)
        
        # Print summary statistics
        print("\n📊 TAXONOMY GENERATION SUMMARY")
        print("=" * 50)
        
        # Count by source
        source_counts = {}
        level_counts = {}
        
        for category in categories:
            source_counts[category.source] = source_counts.get(category.source, 0) + 1
            level_counts[category.level] = level_counts.get(category.level, 0) + 1
        
        print(f"Total Categories: {len(categories)}")
        print("\nBy Source:")
        for source, count in source_counts.items():
            print(f"  {source.upper()}: {count} categories")
        
        print("\nBy Level:")
        for level, count in sorted(level_counts.items()):
            print(f"  Level {level}: {count} categories")
        
        print(f"\nOutput File: {output_file}")
        print("\n✅ Taxonomy generation completed successfully!")
        
        # Display sample categories
        print("\n🔍 SAMPLE CATEGORIES")
        print("=" * 50)
        
        for source in ["iab", "google", "facebook"]:
            sample_cats = [cat for cat in categories if cat.source == source][:3]
            print(f"\n{source.upper()} Examples:")
            for cat in sample_cats:
                print(f"  • {cat.name} ({cat.id})")
                print(f"    Keywords: {', '.join(cat.keywords[:5])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating taxonomy: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 